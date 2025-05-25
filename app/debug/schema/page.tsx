'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SchemaDebugPage() {
  const [tableName, setTableName] = useState('profiles');
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/debug/schema?table=${tableName}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schema');
      }
      
      const data = await response.json();
      setColumns(data.columns || []);
    } catch (err) {
      console.error('Error fetching schema:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Schema Debug</h1>
      
      <div className="mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Table Name</label>
          <Input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter table name"
          />
        </div>
        <Button onClick={fetchSchema} disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Schema'}
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{tableName} Schema</CardTitle>
        </CardHeader>
        <CardContent>
          {columns.length === 0 ? (
            <p className="text-gray-500">No columns found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Column Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Data Type</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((column, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border border-gray-300 px-4 py-2">{column.column_name}</td>
                      <td className="border border-gray-300 px-4 py-2">{column.data_type}</td>
                      <td className="border border-gray-300 px-4 py-2">{column.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 