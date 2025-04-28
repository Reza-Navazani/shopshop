import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProductResponse } from "@/types";

interface BoxGridProps {
    products: ProductResponse['products'];
    className?: string;
    isAnalyzing?: boolean;
}

export const BoxGrid: React.FC<BoxGridProps> = ({ products, className, isAnalyzing }) => {
    const createMarkup = (content: string) => ({ __html: content });

    if (products.length === 0) {
        return (
            <div className={`${className} flex justify-center items-center min-h-[200px]`}>
                <p className="text-gray-500">No products to display. Try asking about specific products!</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <style>
                {`
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
                `}
            </style>
            {products.map((product, index) => (
                <Card 
                    key={index} 
                    className={`overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300 ${
                        isAnalyzing ? 'analyzing border-blue-400' : 'border-gray-200'
                    }`}
                >
                    <CardHeader className="border-b bg-gray-50">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-800">
                                    <span dangerouslySetInnerHTML={createMarkup(product.title)} />
                                </CardTitle>
                                <CardDescription className="text-blue-600">
                                    <span dangerouslySetInnerHTML={createMarkup(product.store_name)} />
                                </CardDescription>
                            </div>
                            <div className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                                <span dangerouslySetInnerHTML={createMarkup(product.price)} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-100">
                        <div className="py-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                            <p className="text-gray-700">
                                <span dangerouslySetInnerHTML={createMarkup(product.description)} />
                            </p>
                        </div>
                        <div className="py-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Product Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-600">Ingredients:</span>
                                    <p className="text-gray-700 mt-1">
                                        <span dangerouslySetInnerHTML={createMarkup(product.ingredient)} />
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">Origin:</span>
                                    <p className="text-gray-700 mt-1">
                                        <span dangerouslySetInnerHTML={createMarkup(product.made_in)} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};