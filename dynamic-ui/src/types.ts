interface Box {
    text: string;
}

export interface Product {
    title: string;
    description: string;
    price: string;
    store_name: string;
    ingredient: string;
    made_in: string;
}

export interface ProductResponse {
    products: Product[];
    query?: string;
    analysis_complete?: boolean;
    error?: string;
}