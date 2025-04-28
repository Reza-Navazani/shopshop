interface Box {
    text: string;
}

export interface Ingredients {
    list: string[];
    unhealthy?: string[];
}

export interface Product {
    title: string;
    description: string;
    price: string;
    store_name: string;
    ingredients: Ingredients;
    made_in: string;
}

export interface ResponseMetadata {
    highlight_unhealthy: boolean;
}

export interface ProductResponse {
    products: Array<{
        title: string;
        store_name: string;
        price: string;
        description: string;
        made_in: string;
        ingredients: {
            list: string[];
            unhealthy?: string[];
            formatted?: Array<{
                text: string;
                unhealthy: boolean;
            }>;
        };
    }>;
    analysis_complete?: boolean;
}