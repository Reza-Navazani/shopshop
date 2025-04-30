import React, { useEffect, useState } from "react";
import { ApiService } from "@/lib/api-service";
import { BoxGrid } from "@/components/BoxGrid";
import { MessageInput } from "@/components/MessageInput";
import type { ProductResponse } from "@/types";

export default function DynamicTextBoxes() {
  const [products, setProducts] = useState<ProductResponse['products']>([]);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await ApiService.fetchBoxes();
      console.log('Fetched products:', data);
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  const handleMessageSent = async (message: string) => {
    try {
      setIsAnalyzing(true);
      setCurrentQuery(message);
      const data = await ApiService.sendMessage(message);
      console.log('Message response:', data);
      setProducts(data.products || []);
      setIsAnalyzing(!data.analysis_complete);
    } catch (err) {
      console.error("Failed to process message:", err);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(fetchProducts, 2000); // Reduced to 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 pt-2 sm:pt-6 pb-24">
        <div className="mb-4 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Product Information</h2>
          {currentQuery && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600 break-words">Current query: {currentQuery}</p>
              {isAnalyzing && (
                <div className="inline-flex items-center">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-xs sm:text-sm text-blue-500">Analyzing...</span>
                </div>
              )}
            </div>
          )}
          <p className="text-sm sm:text-base text-gray-600">Ask about any product to get detailed information and comparisons</p>
        </div>
        <BoxGrid 
          products={products} 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6"
          isAnalyzing={isAnalyzing}
        />
      </main>

      {/* Search Bar */}
      <MessageInput 
        onMessageSent={handleMessageSent} 
        className="fixed bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] sm:w-full max-w-2xl mx-auto shadow-2xl" 
        disabled={isAnalyzing}
      />
    </div>
  );
}
