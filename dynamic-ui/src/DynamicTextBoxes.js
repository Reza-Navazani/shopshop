import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ApiService } from "@/lib/api-service";
import { BoxGrid } from "@/components/BoxGrid";
import { MessageInput } from "@/components/MessageInput";
export default function DynamicTextBoxes() {
    const [products, setProducts] = useState([]);
    const [currentQuery, setCurrentQuery] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fetchProducts = async () => {
        try {
            const data = await ApiService.fetchBoxes();
            console.log('Fetched products:', data);
            setProducts(data.products || []);
        }
        catch (err) {
            console.error("Failed to load products:", err);
        }
    };
    const handleMessageSent = async (message) => {
        try {
            setIsAnalyzing(true);
            setCurrentQuery(message);
            const data = await ApiService.sendMessage(message);
            console.log('Message response:', data);
            setProducts(data.products || []);
            setIsAnalyzing(!data.analysis_complete);
        }
        catch (err) {
            console.error("Failed to process message:", err);
            setIsAnalyzing(false);
        }
    };
    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 2000); // Reduced to 2 seconds
        return () => clearInterval(interval);
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white shadow-sm fixed top-0 left-0 right-0 z-10", children: _jsx("div", { className: "max-w-7xl mx-auto", children: _jsx("div", { className: "flex items-center justify-between px-4 py-4", children: _jsxs("div", { className: "flex items-center space-x-8", children: [_jsx("h1", { className: "text-2xl font-bold text-blue-600", children: "ProductAdvisor" }), _jsxs("nav", { className: "hidden md:flex space-x-6", children: [_jsx("a", { href: "#", className: "text-gray-600 hover:text-blue-600 transition-colors", children: "Compare Products" }), _jsx("a", { href: "#", className: "text-gray-600 hover:text-blue-600 transition-colors", children: "Price History" }), _jsx("a", { href: "#", className: "text-gray-600 hover:text-blue-600 transition-colors", children: "Buying Guide" }), _jsx("a", { href: "#", className: "text-gray-600 hover:text-blue-600 transition-colors", children: "Help" })] })] }) }) }) }), _jsxs("main", { className: "max-w-7xl mx-auto px-4 pt-24 pb-20", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-4", children: "Product Information" }), currentQuery && (_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsxs("p", { className: "text-gray-600", children: ["Current query: ", currentQuery] }), isAnalyzing && (_jsxs("div", { className: "inline-flex items-center", children: [_jsx("div", { className: "h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" }), _jsx("span", { className: "ml-2 text-sm text-blue-500", children: "Analyzing..." })] }))] })), _jsx("p", { className: "text-gray-600", children: "Ask about any product to get detailed information and comparisons" })] }), _jsx(BoxGrid, { products: products, className: "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6", isAnalyzing: isAnalyzing })] }), _jsx(MessageInput, { onMessageSent: handleMessageSent, className: "fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-auto shadow-2xl", disabled: isAnalyzing })] }));
}
