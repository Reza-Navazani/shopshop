// filepath: c:\Users\Jafar\Documents\Projects\dynamic\dynamic-ui\src\lib\product-service.ts
import type { UserProduct } from '@/types';
import { verifyToken } from './auth-service';

// Determine API base URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || 'https://dynamic-server-bmcsdef3b9dygjcy.canadacentral-01.azurewebsites.net')
  : 'http://localhost:5000';

/**
 * Save a product scan to the user's history
 */
export async function saveProductScan(scanData: { 
  barcode: string; 
  product_name: string; 
}): Promise<UserProduct> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  console.log('Saving product scan with data:', scanData);
  
  // Verify token is valid before proceeding but don't redirect
  const isValid = await verifyToken();
  if (!isValid) {
    throw new Error('Authentication token is invalid or expired');
  }
  
  try {
    // Ensure barcode and product_name are strings
    const sanitizedData = {
      barcode: String(scanData.barcode),
      product_name: String(scanData.product_name)
    };
    
    console.log('Sending sanitized data:', sanitizedData);
    
    const response = await fetch(`${API_BASE_URL}/api/products/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sanitizedData),
    });
    
    // Get the response text regardless of status
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response text:', responseText);
    
    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      throw new Error(`Server returned non-JSON response: ${responseText}`);
    }
    
    if (!response.ok) {
      throw new Error(data.error || `Server error: ${response.status}`);
    }
    
    return data.scan;
  } catch (error) {
    console.error('Error in saveProductScan:', error);
    throw error;
  }
}

/**
 * Get all product scans for the current user
 */
export async function getUserProductScans(): Promise<UserProduct[]> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    // Handle not authenticated case
    window.alert('Your session has expired. Please log in again.');
    // Redirect to login page
    window.location.href = '/?view=login';
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/products/scans`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch product scans');
  }
  
  return data.scans;
}

/**
 * Get all product scans (admin only)
 */
export async function getAllProductScans(): Promise<UserProduct[]> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    // Handle not authenticated case
    window.alert('Your session has expired. Please log in again.');
    // Redirect to login page
    window.location.href = '/?view=login';
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/products/all-scans`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch all product scans');
  }
  
  return data.scans;
}

/**
 * Delete a product scan by ID
 */
export async function deleteProductScan(scanId: number): Promise<void> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    // Handle not authenticated case
    window.alert('Your session has expired. Please log in again.');
    // Redirect to login page
    window.location.href = '/?view=login';
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/products/scan/${scanId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete product scan');
  }
}