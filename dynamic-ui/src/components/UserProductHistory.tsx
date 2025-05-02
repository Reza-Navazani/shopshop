// filepath: c:\Users\Jafar\Documents\Projects\dynamic\dynamic-ui\src\components\UserProductHistory.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProduct } from '@/types';

interface UserProductHistoryProps {
  limit?: number;
}

export function UserProductHistory({ limit }: UserProductHistoryProps) {
  const { getUserScans, deleteProductScan, userScans, loadingScans } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserScans = async () => {
      try {
        await getUserScans();
      } catch (err) {
        console.error('Error fetching scans:', err);
        setError('Failed to load scan history');
      }
    };

    fetchUserScans();
    // Empty dependency array means this effect runs once on mount
  }, []);

  const handleDelete = async (scanId: number) => {
    try {
      await deleteProductScan(scanId);
    } catch (err) {
      console.error('Error deleting scan:', err);
      setError('Failed to delete scan');
    }
  };

  // Display only the most recent scans if limit is provided
  const displayScans = limit ? userScans.slice(0, limit) : userScans;

  // Simple function to format dates in a readable format
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Your Scan History</h2>
      </div>
      <div className="p-6">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        
        {loadingScans ? (
          <div className="flex justify-center py-4">Loading scan history...</div>
        ) : displayScans.length === 0 ? (
          <div className="text-center py-4">No product scans yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{scan.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{scan.barcode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatTimeAgo(scan.scan_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDelete(scan.id)}
                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}