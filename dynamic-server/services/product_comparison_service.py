from typing import Dict, List, Annotated, Sequence
from langgraph.graph import Graph
from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage
import json
import logging
import traceback

class ProductComparisonService:
    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.current_products = []
        try:
            self.graph = self._create_comparison_graph()
        except Exception as e:
            logging.error(f"Failed to create comparison graph: {str(e)}\n{traceback.format_exc()}")
            raise

    def get_current_products(self) -> List:
        return self.current_products

    def _create_comparison_graph(self) -> Graph:
        def extract_products(state: Dict) -> Dict:
            try:
                logging.info(f"Extracting products from message: {state['user_message']}")
                raw_response = self.llm_service.fetch_response(state["user_message"])
                
                if "error" in raw_response:
                    return {
                        "error": raw_response["error"],
                        "products": [],
                        "should_continue": False
                    }
                
                # Update current products state
                self.current_products = raw_response["products"]
                return {
                    "products": raw_response["products"],
                    "should_continue": True,
                    "user_message": state["user_message"]
                }
            except Exception as e:
                logging.error(f"Error in extract_products: {str(e)}\n{traceback.format_exc()}")
                return {"error": str(e), "products": [], "should_continue": False}

        def analyze_differences(state: Dict) -> Dict:
            try:
                if not state.get("should_continue", False):
                    return state
                
                products = state["products"]
                if len(products) < 2:
                    return {**state, "error": "Not enough products to compare"}

                for i in range(len(products)):
                    for j in range(i + 1, len(products)):
                        self._highlight_differences(products[i], products[j])

                return {
                    "products": products,
                    "analysis_complete": True,
                    "user_message": state["user_message"]
                }
            except Exception as e:
                logging.error(f"Error in analyze_differences: {str(e)}\n{traceback.format_exc()}")
                return {**state, "error": str(e)}

        def format_response(state: Dict) -> Dict:
            try:
                if "error" in state:
                    return {
                        "success": False,
                        "error": state["error"],
                        "products": []
                    }

                return {
                    "success": True,
                    "products": state["products"],
                    "query": state.get("user_message", ""),
                    "analysis_complete": state.get("analysis_complete", False)
                }
            except Exception as e:
                logging.error(f"Error in format_response: {str(e)}\n{traceback.format_exc()}")
                return {"success": False, "error": str(e), "products": []}

        # Create the graph
        workflow = Graph()
        
        # Add nodes
        workflow.add_node("extract", extract_products)
        workflow.add_node("analyze", analyze_differences)
        workflow.add_node("format", format_response)
        
        # Add edges
        workflow.add_edge("extract", "analyze")
        workflow.add_edge("analyze", "format")
        
        # Set entry point
        workflow.set_entry_point("extract")
        
        # Compile with proper configuration
        return workflow.compile()

    def _highlight_differences(self, product1: Dict, product2: Dict) -> None:
        try:
            for key in product1.keys():
                if key in product2:
                    val1 = str(product1[key])
                    val2 = str(product2[key])
                    if val1 != val2:
                        product1[f"{key}_diff"] = True
                        product2[f"{key}_diff"] = True
        except Exception as e:
            logging.error(f"Error highlighting differences: {str(e)}")

    def process_message(self, message: str) -> Dict:
        try:
            return self.graph.invoke({
                "user_message": message
            })
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}\n{traceback.format_exc()}")
            return {"success": False, "error": str(e), "products": []}