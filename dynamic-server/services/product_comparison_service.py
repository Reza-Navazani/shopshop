from typing import Dict, List, Annotated, Sequence
from langgraph.graph import Graph
from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage
import json
import logging
import traceback
import time

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
                # Ensure state is a valid dictionary
                if not isinstance(state, dict):
                    logging.error(f"Invalid state object: {state}")
                    return {
                        "success": False,
                        "error": "Invalid workflow state",
                        "products": [],
                        "should_continue": False
                    }
                
                # Ensure user_message exists in state
                if "user_message" not in state or not state["user_message"]:
                    logging.error("Missing user_message in workflow state")
                    return {
                        "success": False,
                        "error": "Missing user query",
                        "products": [],
                        "should_continue": False
                    }
                
                logging.info(f"Fetching products from message: {state['user_message']}")
                start_time = time.time()
                
                raw_response = self.llm_service.fetch_response(state["user_message"])
                
                # Ensure raw_response is not None
                if raw_response is None:
                    logging.error("LLM service returned None response")
                    return {
                        "success": False,
                        "error": "Empty response from LLM service",
                        "products": [],
                        "should_continue": False
                    }
                
                elapsed_time = time.time() - start_time
                logging.info(f"LLM response received in {elapsed_time:.2f} seconds")
                
                if "error" in raw_response:
                    error_msg = raw_response.get("error", "Unknown error in LLM service")
                    logging.error(f"LLM service error: {error_msg}")
                    
                    # Check for Azure-specific error details
                    details = raw_response.get("details", {})
                    if details:
                        logging.error(f"Error details: {json.dumps(details)}")
                    
                    return {
                        "success": False,
                        "error": error_msg,
                        "details": details if details else None,
                        "products": [],
                        "should_continue": False
                    }
                
                # Update current products state
                self.current_products = raw_response.get("products", [])
                
                return {
                    "products": raw_response.get("products", []),
                    "metadata": raw_response.get("metadata", {"highlight_unhealthy": False}),
                    "should_continue": True,
                    "user_message": state["user_message"],
                    "success": True
                }
            except Exception as e:
                error_traceback = traceback.format_exc()
                logging.error(f"Error in fetch_products: {str(e)}")
                logging.error(f"Traceback: {error_traceback}")
                return {
                    "success": False, 
                    "error": f"Product comparison error: {str(e)}", 
                    "products": [], 
                    "should_continue": False
                }

        def mark_unhealthy_ingredients(state: Dict) -> Dict:
            try:
                # Ensure state is a valid dictionary
                if not isinstance(state, dict):
                    logging.error(f"Invalid state object in mark_unhealthy_ingredients: {state}")
                    return {
                        "success": False,
                        "error": "Invalid workflow state in mark_unhealthy_ingredients",
                        "products": []
                    }
                
                # If there was an error in the previous step, just pass it through
                if not state.get("success", False) or not state.get("should_continue", False):
                    logging.warning("Skipping unhealthy ingredients marking due to previous error")
                    return state
                
                products = state.get("products", [])
                logging.info(f"Marking unhealthy ingredients for {len(products)} products")
                
                # Common unhealthy ingredients to check for
                unhealthy_ingredients = {
                    "high fructose corn syrup", "artificial sweetener", "artificial color",
                    "msg", "monosodium glutamate", "trans fat", "hydrogenated",
                    "artificial flavor", "sodium nitrite", "sodium nitrate",
                    "food coloring", "corn syrup", "partially hydrogenated",
                    "aspartame", "saccharin", "sucralose", "caramel color",
                    "acesulfame potassium"
                }
                
                # Handle case where products is not a list
                if not isinstance(products, list):
                    logging.error(f"Products is not a list: {products}")
                    products = []
                
                for product in products:
                    # Skip invalid products or products without ingredients
                    if not isinstance(product, dict):
                        logging.warning(f"Skipping invalid product: {product}")
                        continue
                        
                    # Ensure ingredients exist as a dictionary
                    if "ingredients" not in product or not isinstance(product["ingredients"], dict):
                        logging.info(f"Adding missing ingredients structure for product: {product.get('title', 'Unknown')}")
                        product["ingredients"] = {"list": [], "unhealthy": []}
                    
                    # Ensure list exists in ingredients
                    ingredients_list = product["ingredients"].get("list", [])
                    if not isinstance(ingredients_list, list):
                        logging.warning(f"Invalid ingredients list format for product: {product.get('title', 'Unknown')}")
                        ingredients_list = []
                        product["ingredients"]["list"] = ingredients_list
                    
                    # Always create formatted array with text and unhealthy flag
                    product["ingredients"]["formatted"] = []
                    
                    for ingredient in ingredients_list:
                        # Skip non-string ingredients if any
                        if not isinstance(ingredient, str):
                            logging.warning(f"Skipping non-string ingredient: {ingredient}")
                            continue
                            
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
                
                # Ensure metadata is properly set
                if "metadata" not in state or state["metadata"] is None:
                    state["metadata"] = {"highlight_unhealthy": True}
                elif isinstance(state["metadata"], dict):
                    state["metadata"]["highlight_unhealthy"] = True
                
                # Ensure user_message is preserved
                user_message = state.get("user_message", "")
                
                return {
                    "success": True,
                    "products": products,
                    "metadata": state.get("metadata", {"highlight_unhealthy": True}),
                    "query": user_message,
                    "user_message": user_message  # Preserve original user message
                }
            except Exception as e:
                error_traceback = traceback.format_exc()
                logging.error(f"Error in mark_unhealthy_ingredients: {str(e)}")
                logging.error(f"Traceback: {error_traceback}")
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
        
        # Set end points
        workflow.set_finish_point("mark_unhealthy")
        
        try:
            compiled_graph = workflow.compile()
            logging.info("Successfully compiled workflow graph")
            return compiled_graph
        except Exception as e:
            logging.error(f"Error compiling graph: {str(e)}")
            logging.error(traceback.format_exc())
            raise

    def process_message(self, message: str) -> Dict:
        try:
            if not message or not isinstance(message, str):
                logging.error(f"Invalid message provided: {message}")
                return {"success": False, "error": "Invalid message format", "products": []}
                
            logging.info(f"Processing message through workflow graph: {message[:50]}...")
            start_time = time.time()
            
            try:
                # Use a try-except block specifically around the graph invoke
                result = self.graph.invoke({
                    "user_message": message
                })
            except Exception as graph_error:
                logging.error(f"Error during graph execution: {str(graph_error)}")
                logging.error(traceback.format_exc())
                return {
                    "success": False, 
                    "error": f"Workflow execution error: {str(graph_error)}", 
                    "products": []
                }
            
            elapsed_time = time.time() - start_time
            logging.info(f"Message processing completed in {elapsed_time:.2f} seconds")
            
            # Ensure result is a dictionary to prevent NoneType errors
            if result is None:
                logging.error("Workflow returned None result")
                return {"success": False, "error": "Workflow error: No result returned", "products": []}
            
            # Log success/failure
            if result.get("success", False):
                product_count = len(result.get("products", []))
                logging.info(f"Successfully processed message with {product_count} products found")
            else:
                error_msg = result.get("error", "Unknown error")
                logging.error(f"Failed to process message: {error_msg}")
            
            return result
            
        except Exception as e:
            error_traceback = traceback.format_exc()
            logging.error(f"Unexpected error processing message: {str(e)}")
            logging.error(f"Traceback: {error_traceback}")
            return {"success": False, "error": f"Workflow error: {str(e)}", "products": []}