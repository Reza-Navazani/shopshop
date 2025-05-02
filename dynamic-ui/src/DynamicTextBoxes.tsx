import React, { useEffect, useState } from "react";
import { ApiService } from "@/lib/api-service";
import { BoxGrid } from "@/components/BoxGrid";
import { MessageInput } from "@/components/MessageInput";
import type { ProductResponse } from "@/types";

export default function DynamicTextBoxes() {
  const [products, setProducts] = useState<ProductResponse['products']>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const data = await ApiService.fetchBoxes();
      console.log('Fetched products:', data);
      
      // Show any error message if present but still set products
      if (data.error) {
        setError(data.error);
      } else {
        setError(null);
      }
      
      // Always set products (even if empty) to avoid null/undefined issues
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
    }
  };

  const handleMessageSent = async (message: string) => {
    try {
      setIsAnalyzing(true);
      setCurrentQuery(message);
      setError(null);
      
      console.log('Sending message:', message);
      const data = await ApiService.sendMessage(message);
      console.log('Message response:', data);
      
      if (data.error) {
        setError(data.error);
      }
      
      // Set products even if there's an error, using empty array as fallback
      setProducts(data.products || []);
      setIsAnalyzing(false);
    } catch (err) {
      console.error("Failed to process message:", err);
      setError(err instanceof Error ? err.message : "Failed to process message. Please try again.");
      setProducts([]);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 sm:p-8">
      {/* Header section with animations */}
      <div className="mb-6 sm:mb-10 transition-all duration-300 ease-in-out">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Product Information
        </h2>
        
        {/* Display error message if there is one */}
        {error && (
          <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm animate-fadeIn">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {currentQuery && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100 transition-all duration-300 ease-in-out">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm sm:text-base text-blue-700 font-medium break-words">
                Query: <span className="font-normal text-blue-600">{currentQuery}</span>
              </p>
            </div>
            {isAnalyzing && (
              <div className="inline-flex items-center ml-auto mt-2 sm:mt-0">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-blue-600 font-medium">Analyzing...</span>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-base sm:text-lg text-gray-700 font-medium">
                Ask about any product to get detailed information and comparisons
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Try asking specific questions about product features, pricing, or availability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products grid with animation */}
      <div className="transition-all duration-500 ease-in-out">
        <BoxGrid 
          products={products} 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
          isAnalyzing={isAnalyzing}
        />
      </div>

      {/* Search Bar */}
      <MessageInput 
        onMessageSent={handleMessageSent} 
        className="fixed bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-full max-w-2xl mx-auto shadow-2xl" 
        disabled={isAnalyzing}
      />
    </div>
  );
}
