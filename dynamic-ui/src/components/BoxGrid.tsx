import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProductResponse } from "@/types";

interface BoxGridProps {
    products: ProductResponse['products'];
    className?: string;
    isAnalyzing?: boolean;
}

export const BoxGrid: React.FC<BoxGridProps> = ({ products, className, isAnalyzing }) => {
    // This function ensures we handle undefined or null content safely
    const createMarkup = (content: string | undefined) => {
        // Handle undefined or null content by providing an empty string
        return { __html: content || '' };
    };

    // This function handles all possible ingredient data structures and edge cases
    const renderIngredients = (product: ProductResponse['products'][number]) => {
        // If ingredients property is missing, undefined, or not an object
        if (!product || !product.ingredients || typeof product.ingredients !== 'object') {
            return 'No ingredient information available';
        }

        // Check specifically for formatted ingredients
        const formattedIngredients = product.ingredients.formatted;
        
        // If formatted ingredients array exists and has items
        if (Array.isArray(formattedIngredients) && formattedIngredients.length > 0) {
            return formattedIngredients.map((ingredient, index) => {
                // Ensure ingredient.text exists to prevent undefined errors
                if (!ingredient || typeof ingredient !== 'object' || !ingredient.text) {
                    return null;
                }
                
                return (
                    <React.Fragment key={index}>
                        <span className={ingredient.unhealthy 
                            ? 'text-red-500 font-semibold !text-red-500 inline-block px-1 bg-red-50 rounded' 
                            : 'text-gray-700'}>
                            {ingredient.text}
                        </span>
                        {index < formattedIngredients.length - 1 && ', '}
                    </React.Fragment>
                );
            }).filter(Boolean); // Remove any null items
        }

        // Check for regular ingredients list
        const ingredientsList = product.ingredients.list;
        if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
            return ingredientsList.join(', ');
        }

        // Fallback message when no ingredients found
        return 'Ingredients not available';
    };

    // Handle empty product list
    if (!products || products.length === 0) {
        return (
            <div className={`${className} flex justify-center items-center min-h-[200px]`}>
                <div className="text-center p-8 rounded-lg border border-gray-200 bg-gray-50 animate-fadeIn">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-gray-600 font-medium">No products to display.</p>
                    <p className="text-gray-500 mt-2">Try asking about specific products!</p>
                </div>
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
                        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                        70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                    }
                    @keyframes subtle-scale {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.01); }
                        100% { transform: scale(1); }
                    }
                    @keyframes shine {
                        0% { background-position: -100% 0; }
                        100% { background-position: 200% 0; }
                    }
                    .analyzing {
                        animation: pulse-border 2s infinite, subtle-scale 3s ease-in-out infinite;
                        border-width: 2px;
                    }
                    .card-hover-effect {
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        border-radius: 16px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    }
                    .card-hover-effect:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 16px 30px -10px rgba(0, 0, 0, 0.1), 0 8px 15px -8px rgba(0, 0, 0, 0.08);
                    }
                    .product-image {
                        transition: transform 0.7s ease;
                        border-top-left-radius: 16px;
                        border-top-right-radius: 16px;
                    }
                    .card-hover-effect:hover .product-image {
                        transform: scale(1.08);
                    }
                    .price-tag {
                        position: relative;
                        clip-path: polygon(10px 0, 100% 0, 100% 100%, 0 100%);
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                        transition: all 0.3s ease;
                    }
                    .card-hover-effect:hover .price-tag {
                        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    }
                    .shine-effect {
                        position: relative;
                        overflow: hidden;
                    }
                    .shine-effect::after {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 200%;
                        height: 100%;
                        background: linear-gradient(90deg, 
                                   transparent, 
                                   rgba(255, 255, 255, 0.2), 
                                   transparent);
                        background-size: 200% 100%;
                        animation: shine 2s infinite;
                    }
                    .detail-icon {
                        color: #6366f1;
                        background-color: #ede9fe;
                        padding: 4px;
                        border-radius: 50%;
                    }
                `}
            </style>
            {products.map((product, index) => (
                <Card 
                    key={index} 
                    className={`overflow-hidden transition-all duration-300 card-hover-effect animate-fadeIn ${
                        isAnalyzing ? 'analyzing border-indigo-400' : 'border-gray-100 hover:border-indigo-200'
                    }`}
                    style={{animationDelay: `${index * 0.1}s`}}
                >
                    {product.image_url && (
                        <div className="relative w-full h-56 overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
                            <img 
                                src={product.image_url} 
                                alt={product.title || "Product Image"} 
                                className="w-full h-full object-cover product-image"
                                onError={(e) => {
                                    // Replace broken image with a placeholder
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Product+Image';
                                }}
                            />
                            {product.price && (
                                <div className="absolute top-4 right-0 price-tag py-1.5 pl-4 pr-4 text-white text-sm font-bold shadow-lg shine-effect">
                                    <span dangerouslySetInnerHTML={createMarkup(product.price)} />
                                </div>
                            )}
                        </div>
                    )}
                    <CardHeader className={`border-b p-5 ${!product.image_url ? 'rounded-t-xl bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-white'}`}>
                        <div className="flex flex-col justify-between gap-2">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-700 transition-colors duration-300">
                                    {product.title ? (
                                        <span dangerouslySetInnerHTML={createMarkup(product.title)} />
                                    ) : (
                                        <span className="text-gray-400 italic">Product Name Unavailable</span>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-indigo-600 text-sm font-medium mt-2 flex items-center">
                                    {product.store_name ? (
                                        <>
                                            <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            <span dangerouslySetInnerHTML={createMarkup(product.store_name)} />
                                        </>
                                    ) : (
                                        <span className="text-gray-400 italic">Store Unavailable</span>
                                    )}
                                </CardDescription>
                            </div>
                            {!product.image_url && product.price && (
                                <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium self-start mt-1 shadow-md">
                                    <span dangerouslySetInnerHTML={createMarkup(product.price)} />
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-100 p-5 bg-white">
                        <div className="py-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Description
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {product.description ? (
                                    <span dangerouslySetInnerHTML={createMarkup(product.description)} />
                                ) : (
                                    <span className="text-gray-500 italic">No description available</span>
                                )}
                            </p>
                        </div>
                        <div className="py-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <svg className="w-5 h-5 mr-2 detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Product Details
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm rounded-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl shadow-sm">
                                    <div className="flex items-center mb-2">
                                        <span className="font-medium text-indigo-700 flex items-center">
                                            <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Ingredients:
                                        </span>
                                    </div>
                                    <p className="text-gray-700 ml-6">
                                        {renderIngredients(product)}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl shadow-sm">
                                    <div className="flex items-center mb-2">
                                        <span className="font-medium text-indigo-700 flex items-center">
                                            <svg className="w-4 h-4 mr-1.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Origin:
                                        </span>
                                    </div>
                                    <p className="text-gray-700 ml-6">
                                        {product.made_in ? (
                                            <span dangerouslySetInnerHTML={createMarkup(product.made_in)} />
                                        ) : (
                                            <span className="text-gray-500 italic">Origin not specified</span>
                                        )}
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