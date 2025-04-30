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
      {/* Header 
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">ProductAdvisor</h1>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Compare Products</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Price History</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Buying Guide</a>
                <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Help</a>
              </nav>
            </div>
          </div>
        </div>
      </header>*/}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Information</h2>
          {currentQuery && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-gray-600">Current query: {currentQuery}</p>
              {isAnalyzing && (
                <div className="inline-flex items-center">
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-blue-500">Analyzing...</span>
                </div>
              )}
            </div>
          )}
          <p className="text-gray-600">Ask about any product to get detailed information and comparisons</p>
        </div>
        <BoxGrid 
          products={products} 
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          isAnalyzing={isAnalyzing}
        />
      </main>

      {/* Search Bar */}
      <MessageInput 
        onMessageSent={handleMessageSent} 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-auto shadow-2xl" 
        disabled={isAnalyzing}
      />
    </div>
  );
}
