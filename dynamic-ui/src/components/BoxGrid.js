import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
export const BoxGrid = ({ products, className, isAnalyzing }) => {
    const createMarkup = (content) => ({ __html: content });
    const renderIngredients = (product) => {
        if (!product.ingredients) {
            return '';
        }
        // Always use formatted ingredients when available
        if (product.ingredients.formatted) {
            return product.ingredients.formatted.map((ingredient, index) => (_jsxs(React.Fragment, { children: [_jsx("span", { className: ingredient.unhealthy ? 'text-red-500 font-semibold !text-red-500 inline-block' : 'text-gray-700', children: ingredient.text }), index < product.ingredients.formatted.length - 1 && ', '] }, index)));
        }
        // Fallback to simple list if formatted is not available
        return product.ingredients.list.join(', ');
    };
    if (products.length === 0) {
        return (_jsx("div", { className: `${className} flex justify-center items-center min-h-[200px]`, children: _jsx("p", { className: "text-gray-500", children: "No products to display. Try asking about specific products!" }) }));
    }
    return (_jsxs("div", { className: className, children: [_jsx("style", { children: `
                    .highlight-diff {
                        background-color: rgba(34, 197, 94, 0.2);
                        border-radius: 0.25rem;
                        padding: 0.125rem 0.25rem;
                        border: 1px solid rgba(34, 197, 94, 0.3);
                    }
                    @keyframes pulse-border {
                        0% { border-color: rgba(59, 130, 246, 0.3); }
                        50% { border-color: rgba(59, 130, 246, 0.6); }
                        100% { border-color: rgba(59, 130, 246, 0.3); }
                    }
                    .analyzing {
                        animation: pulse-border 2s infinite;
                        border-width: 2px;
                    }
                ` }), products.map((product, index) => (_jsxs(Card, { className: `overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 ${isAnalyzing ? 'analyzing border-blue-400' : 'border-gray-200'}`, children: [_jsx(CardHeader, { className: "border-b bg-gray-50", children: _jsxs("div", { className: "flex justify-between items-start gap-4", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-xl font-bold text-gray-800", children: _jsx("span", { dangerouslySetInnerHTML: createMarkup(product.title) }) }), _jsx(CardDescription, { className: "text-blue-600", children: _jsx("span", { dangerouslySetInnerHTML: createMarkup(product.store_name) }) })] }), _jsx("div", { className: "px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium", children: _jsx("span", { dangerouslySetInnerHTML: createMarkup(product.price) }) })] }) }), _jsxs(CardContent, { className: "divide-y divide-gray-100", children: [_jsxs("div", { className: "py-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-500 mb-2", children: "Description" }), _jsx("p", { className: "text-gray-700", children: _jsx("span", { dangerouslySetInnerHTML: createMarkup(product.description) }) })] }), _jsxs("div", { className: "py-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-500 mb-2", children: "Product Details" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Ingredients:" }), _jsx("p", { className: "text-gray-700 mt-1", children: renderIngredients(product) })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-600", children: "Origin:" }), _jsx("p", { className: "text-gray-700 mt-1", children: _jsx("span", { dangerouslySetInnerHTML: createMarkup(product.made_in) }) })] })] })] })] })] }, index)))] }));
};
