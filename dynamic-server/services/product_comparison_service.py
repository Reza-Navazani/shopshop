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
        def fetch_products(state: Dict) -> Dict:
            try:
                logging.info(f"Fetching products from message: {state['user_message']}")
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
                    "user_message": state["user_message"],
                    "success": True
                }
            except Exception as e:
                logging.error(f"Error in fetch_products: {str(e)}\n{traceback.format_exc()}")
                return {"error": str(e), "products": [], "should_continue": False}

        def mark_unhealthy_ingredients(state: Dict) -> Dict:
            try:
                if not state.get("should_continue", False):
                    return state
                
                products = state.get("products", [])
                
                # Common unhealthy ingredients to check for
                unhealthy_ingredients = {
                    "high fructose corn syrup", "artificial sweetener", "artificial color",
                    "msg", "monosodium glutamate", "trans fat", "hydrogenated",
                    "artificial flavor", "sodium nitrite", "sodium nitrate",
                    "food coloring", "corn syrup", "partially hydrogenated",
                    "aspartame", "saccharin", "sucralose", "caramel color",
                    "acesulfame potassium"
                }
                
                for product in products:
                    if "ingredients" in product:
                        ingredients_list = product["ingredients"].get("list", [])
                        # Always create formatted array with text and unhealthy flag
                        product["ingredients"]["formatted"] = []
                        for ingredient in ingredients_list:
                            is_unhealthy = any(unhealthy in ingredient.lower() for unhealthy in unhealthy_ingredients)
                            product["ingredients"]["formatted"].append({
                                "text": ingredient,
                                "unhealthy": is_unhealthy
                            })
                        # Keep the unhealthy list for backwards compatibility
                        product["ingredients"]["unhealthy"] = [
                            ing["text"] for ing in product["ingredients"]["formatted"]
                            if ing["unhealthy"]
                        ]
                
                state["metadata"] = {"highlight_unhealthy": True}
                
                return {
                    "success": True,
                    "products": products,
                    "metadata": state.get("metadata", {}),
                    "query": state.get("user_message", "")
                }
            except Exception as e:
                logging.error(f"Error in mark_unhealthy_ingredients: {str(e)}\n{traceback.format_exc()}")
                return {"success": False, "error": str(e), "products": []}

        # Create the graph
        workflow = Graph()
        
        # Add just 2 nodes
        workflow.add_node("fetch", fetch_products)
        workflow.add_node("mark_unhealthy", mark_unhealthy_ingredients)
        
        # Connect the nodes
        workflow.add_edge("fetch", "mark_unhealthy")
        
        # Set entry point
        workflow.set_entry_point("fetch")
        
        return workflow.compile()

    def process_message(self, message: str) -> Dict:
        try:
            return self.graph.invoke({
                "user_message": message
            })
        except Exception as e:
            logging.error(f"Error processing message: {str(e)}\n{traceback.format_exc()}")
            return {"success": False, "error": str(e), "products": []}