"""
cerberus_ai.inspector
~~~~~~~~~~~~~~~~~~~~~
Core Cerberus inspection engine.

Orchestrates L1, L2, L3 detectors and EGI into a single synchronous
and async inspection API. Emits events to Observe.
"""
from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Callable
from typing import Any

from cerberus_ai.detectors.l1 import L1Detector
from cerberus_ai.detectors.l2 import L2Detector
from cerberus_ai.detectors.l3 import L3Detector, SessionL3State
from cerberus_ai.egi.engine import EGIEngine
from cerberus_ai.models import (
    CerberusConfig,
    EventType,
    InspectionResult,
    Message,
    SecurityEvent,
    Severity,
    ToolCall,
    TrifectaConditions,
)
from cerberus_ai.telemetry.observe import ObserveEmitter


class CerberusInspector:
    """
    Core inspection engine for a single Cerberus session.

    One inspector per agent session. Maintains session state (L3 cross-turn
    tracking, EGI graph, turn counter).
    """

    def __init__(
        self,
        session_id: str,
        config: CerberusConfig,
        observe: ObserveEmitter,
        agent_id: str | None = None,
    ) -> None:
        self._session_id = session_id
        self._config = config
        self._observe = observe
        self._agent_id = agent_id or str(uuid.uuid4())
        self._turn_counter = 0
        self._sequence_number = 0

        # Initialize detectors
        self._l1 = L1Detector(
            data_sources=config.data_sources,
            declared_tools=config.declared_tools,
        )
        self._l2 = L2Detector()
        self._l3 = L3Detector(
            declared_tools=config.declared_tools,
            intent_threshold=config.l3_behavioral_intent_threshold,
        )

        # Session state for cross-turn L3 tracking
        self._l3_state = SessionL3State(
            session_id=session_id,
            retention_turns=config.cross_turn_data_flow_retention_turns
            if hasattr(config, "cross_turn_data_flow_retention_turns")
            else 10,
        )

        # EGI engine
        self._egi = EGIEngine(
            session_id=session_id,
            agent_id=self._agent_id,
            declared_tools=config.declared_tools,
        )

    def _parse_tool_calls(self, raw_tool_calls: list[dict[str, Any]] | None) -> list[ToolCall]:
        """Parse raw tool call dicts into ToolCall models."""
        if not raw_tool_calls:
            return []
        result = []
        for tc in raw_tool_calls:
            try:
                import json
                args = tc.get("arguments", tc.get("function", {}).get("arguments", {}))
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except Exception:
                        args = {"raw": args}
                result.append(ToolCall(
                    id=tc.get("id", str(uuid.uuid4())),
                    name=tc.get("name", tc.get("function", {}).get("name", "unknown")),
                    arguments=args if isinstance(args, dict) else {},
                    raw_arguments=str(args),
                ))
            except Exception:
                logging.debug("Failed to parse tool call: %s", tc, exc_info=True)
        return result

    def _emit(self, event: SecurityEvent) -> None:
        self._sequence_number += 1
        event.sequence_number = self._sequence_number
        self._observe.emit(event)

    def inspect(
        self,
        messages: list[Message] | list[dict[str, Any]],
        tool_calls: list[dict[str, Any]] | None = None,
        partial_signal_callback: Callable[[SecurityEvent], None] | None = None,
    ) -> InspectionResult:
        """
        Synchronous inspection of a complete LLM turn.

        Args:
            messages: Conversation messages (Message objects or dicts)
            tool_calls: Tool calls made in this turn (optional)
            partial_signal_callback: Called for each partial detection signal

        Returns:
            InspectionResult — check .blocked and .trifecta_detected
        """
        start_us = time.perf_counter_ns() // 1000
        self._turn_counter += 1
        self._l3_state.advance_turn()

        turn_id = str(uuid.uuid4())
        events: list[SecurityEvent] = []

        # Normalize message dicts to Message objects
        normalized_messages: list[Message] = []
        for m in messages:
            if isinstance(m, dict):
                fields = {
                    k: v for k, v in m.items()
                    if k in Message.model_fields
                }
                normalized_messages.append(Message(**fields))
            else:
                normalized_messages.append(m)

        parsed_tool_calls = self._parse_tool_calls(tool_calls)

        # ── L1 Detection ──────────────────────────────────────────────────────
        l1_result = self._l1.detect(normalized_messages, parsed_tool_calls)
        l1_active = l1_result.confidence >= 0.60

        if l1_active:
            # Record data flow token for cross-turn tracking
            content_text = " ".join(
                m.content if isinstance(m.content, str) else str(m.content or "")
                for m in normalized_messages if m.role == "tool"
            )
            fingerprint = __import__("hashlib").sha256(content_text.encode()).hexdigest()[:16]
            self._l3_state.record_l1_data_access("DETECTED", fingerprint)

            event = SecurityEvent(
                event_type=EventType.PARTIAL_L1,
                severity=Severity.ADVISORY,
                turn_id=turn_id,
                session_id=self._session_id,
                l1_detail=l1_result,
                conditions=TrifectaConditions(l1_privileged_data=True),
            )
            events.append(event)
            self._emit(event)
            if partial_signal_callback:
                partial_signal_callback(event)

        # ── L2 Detection ──────────────────────────────────────────────────────
        l2_result = self._l2.detect(normalized_messages)
        l2_active = l2_result.confidence >= 0.60

        if l2_active:
            self._l3_state.record_l2_detected()
            event = SecurityEvent(
                event_type=EventType.PARTIAL_L2,
                severity=Severity.HIGH if l1_active else Severity.ADVISORY,
                turn_id=turn_id,
                session_id=self._session_id,
                l2_detail=l2_result,
                conditions=TrifectaConditions(l1_privileged_data=l1_active, l2_injection=True),
            )
            events.append(event)
            self._emit(event)
            if partial_signal_callback:
                partial_signal_callback(event)

        # ── L3 Detection ──────────────────────────────────────────────────────
        l3_result = self._l3.detect(
            messages=normalized_messages,
            tool_calls=parsed_tool_calls,
            session_state=self._l3_state,
            l1_active=l1_active,
            l2_active=l2_active,
        )
        l3_active = l3_result.confidence >= 0.55

        if l3_active:
            event = SecurityEvent(
                event_type=EventType.PARTIAL_L3,
                severity=Severity.ADVISORY,
                turn_id=turn_id,
                session_id=self._session_id,
                l3_detail=l3_result,
                conditions=TrifectaConditions(
                    l1_privileged_data=l1_active,
                    l2_injection=l2_active,
                    l3_exfiltration_path=True,
                ),
            )
            events.append(event)
            self._emit(event)
            if partial_signal_callback:
                partial_signal_callback(event)

        # ── EGI Check ─────────────────────────────────────────────────────────
        egi_violations = self._egi.check_turn(
            tool_calls=parsed_tool_calls,
            current_turn=self._turn_counter,
            l2_active=l2_active,
        )
        for v in egi_violations:
            event = SecurityEvent(
                event_type=EventType.EGI_VIOLATION,
                severity=Severity.CRITICAL,
                turn_id=turn_id,
                session_id=self._session_id,
                egi_violation=v,
                blocked=True,
            )
            events.append(event)
            self._emit(event)

        # ── Trifecta Correlation ──────────────────────────────────────────────
        conditions = TrifectaConditions(
            l1_privileged_data=l1_active,
            l2_injection=l2_active,
            l3_exfiltration_path=l3_active,
        )
        blocked = conditions.trifecta_active or bool(egi_violations)

        if conditions.trifecta_active:
            trifecta_event = SecurityEvent(
                event_type=EventType.LETHAL_TRIFECTA,
                severity=Severity.CRITICAL,
                turn_id=turn_id,
                session_id=self._session_id,
                conditions=conditions,
                l1_detail=l1_result,
                l2_detail=l2_result,
                l3_detail=l3_result,
                blocked=True,
                payload={
                    "l1_evidence": l1_result.evidence,
                    "l2_evidence": l2_result.evidence,
                    "l3_evidence": l3_result.evidence,
                    "l1_confidence": l1_result.confidence,
                    "l2_confidence": l2_result.confidence,
                    "l3_confidence": l3_result.confidence,
                },
            )
            events.append(trifecta_event)
            self._emit(trifecta_event)

        end_us = time.perf_counter_ns() // 1000
        latency_us = end_us - start_us

        return InspectionResult(
            turn_id=turn_id,
            session_id=self._session_id,
            blocked=blocked,
            conditions=conditions,
            severity=conditions.severity,
            events=events,
            egi_violations=egi_violations,
            inspection_latency_us=latency_us,
        )

    async def inspect_async(
        self,
        messages: list[Message] | list[dict[str, Any]],
        tool_calls: list[dict[str, Any]] | None = None,
        partial_signal_callback: Callable[[SecurityEvent], None] | None = None,
    ) -> InspectionResult:
        """
        Async wrapper for inspect(). Runs inspection in asyncio executor
        to avoid blocking the event loop.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.inspect(messages, tool_calls, partial_signal_callback),
        )

    def register_tool_late(
        self,
        tool: Any,
        reason: str,
        authorized_by: str,
    ) -> tuple[bool, str]:
        """Register a tool after initialization via the controlled late-binding hook."""
        from cerberus_ai.models import ToolSchema
        if not isinstance(tool, ToolSchema):
            # Allow dict-style registration
            tool = ToolSchema(**tool) if isinstance(tool, dict) else tool

        l2_active = self._l3_state.l2_detected_recently(window=1)
        success, message = self._egi.register_tool_late(
            tool=tool,
            reason=reason,
            authorized_by=authorized_by,
            current_turn=self._turn_counter,
            l2_active=l2_active,
        )

        if not success:
            event = SecurityEvent(
                event_type=EventType.EGI_INJECTION_ASSISTED_REGISTRATION,
                severity=Severity.CRITICAL,
                turn_id=str(uuid.uuid4()),
                session_id=self._session_id,
                payload={"tool_name": tool.name, "reason": reason, "message": message},
                blocked=True,
            )
            self._emit(event)

        return success, message
