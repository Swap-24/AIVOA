from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.graph.nodes import (
    classify_intent_node,
    completeness_check_node,
    extract_and_merge_node,
    generate_response_node,
    risk_assessment_node,
)
from app.graph.state import CopilotState


def route_after_intent(state: CopilotState) -> str:
    if state.get("intent") == "off_topic":
        return "respond"
    return "extract"


def build_copilot_graph():
    graph = StateGraph(CopilotState)

    graph.add_node("classify_intent", classify_intent_node)
    graph.add_node("extract", extract_and_merge_node)
    graph.add_node("check_completeness", completeness_check_node)
    graph.add_node("risk_assessment", risk_assessment_node)
    graph.add_node("respond", generate_response_node)

    graph.set_entry_point("classify_intent")

    graph.add_conditional_edges(
        "classify_intent",
        route_after_intent,
        {"extract": "extract", "respond": "respond"},
    )

    graph.add_edge("extract", "check_completeness")
    graph.add_edge("check_completeness", "risk_assessment")
    graph.add_edge("risk_assessment", "respond")
    graph.add_edge("respond", END)

    return graph.compile()


copilot_graph = build_copilot_graph()