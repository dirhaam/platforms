'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types/booking';

interface CustomerSearchProps {
  tenantId: string;
  onCustomerSelect: (customer: Customer) => void;
  onCreateNew?: (searchQuery: string) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSearch({
  tenantId,
  onCustomerSelect,
  onCreateNew,
  placeholder = "Search customers by name, phone, or email...",
  className = ''
}: CustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchCustomers(query.trim());
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicks outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showResults) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex === -1 && onCreateNew) {
            // Create new customer
            onCreateNew(query);
            setQuery('');
            setShowResults(false);
          } else if (selectedIndex >= 0 && selectedIndex < results.length) {
            // Select customer
            handleCustomerSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showResults) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showResults, selectedIndex, results, query, onCreateNew]);

  const searchCustomers = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.customers || []);
        setShowResults(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setQuery('');
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(query);
      setQuery('');
      setShowResults(false);
    }
  };

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatLastBooking = (date: Date | null): string => {
    if (!date) return 'No bookings';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {results.length === 0 && !loading ? (
              <div className="p-4 text-center">
                <div className="text-gray-500 mb-2">No customers found</div>
                {onCreateNew && query.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create new customer "{query}"
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {results.map((customer, index) => (
                  <div
                    key={customer.id}
                    className={`
                      p-4 cursor-pointer transition-colors
                      ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900 truncate">
                            {highlightMatch(customer.name, query)}
                          </div>
                          {customer.totalBookings > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {customer.totalBookings} booking{customer.totalBookings !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{highlightMatch(customer.phone, query)}</span>
                          </div>
                          {customer.email && (
                            <div className="text-sm text-gray-500 truncate">
                              {highlightMatch(customer.email, query)}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Last booking: {formatLastBooking(customer.lastBookingAt || null)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Create new option */}
                {onCreateNew && query.trim() && (
                  <div
                    className={`
                      p-4 cursor-pointer transition-colors border-t border-dashed
                      ${selectedIndex === results.length ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                    onClick={handleCreateNew}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-700">
                          Create new customer "{query}"
                        </div>
                        <div className="text-sm text-green-600">
                          Add this as a new customer
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}