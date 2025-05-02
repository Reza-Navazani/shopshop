interface Box {
    text: string;
}

export interface Ingredients {
    list: string[];
    unhealthy?: string[];
    formatted?: Array<{
        text: string;
        unhealthy: boolean;
    }>;
}

export interface Product {
    title: string;
    description: string;
    price: string;
    store_name: string;
    ingredients: Ingredients;
    made_in: string;
    image_url?: string;
}

// User product scan interface
export interface UserProduct {
    id: number;
    user_id: number;
    barcode: string;
    product_name: string;
    scan_date: string;
    username?: string;
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
        image_url?: string;
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
    success?: boolean;
    error?: string;
    message?: string;
}

// Authentication types
export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    preferred_store?: string;
    dietary_preferences?: string;
    created_at?: string;
}

export interface AuthResponse {
    message: string;
    access_token: string;
    user: User;
}

export interface LoginFormData {
    username: string;
    password: string;
}

export interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
}

// User preferences interface
export interface UserPreference {
    id?: number;
    user_id?: number;
    allergies: string;
    ingredients_to_avoid: string;
    brands_of_interest: string;
    price_preference: string;
    store_preference: string;
    created_at?: string;
    updated_at?: string;
}

export interface PreferenceResponse {
    success: boolean;
    preferences: UserPreference;
    message?: string;
    error?: string;
}