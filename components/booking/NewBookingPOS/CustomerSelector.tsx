import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Customer } from '@/types/booking';
import { toast } from 'sonner';

interface NewCustomer {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: string;
  onCustomerSelect: (customerId: string) => void;
  subdomain: string;
  onCustomerCreated: (customer: Customer) => void;
}

export function CustomerSelector({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  subdomain,
  onCustomerCreated,
}: CustomerSelectorProps) {
  const [showNewCustomerForm, setShowNewCustomerForm] = React.useState(false);
  const [newCustomer, setNewCustomer] = React.useState<NewCustomer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [creatingCustomer, setCreatingCustomer] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = React.useState('');

  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedCustomerId),
    [selectedCustomerId, customers]
  );

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.phone.includes(search)
    );
  }, [customers, customerSearch]);

  const handleCreateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!subdomain) return;

    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      setError('Name and phone are required');
      return;
    }

    setCreatingCustomer(true);
    setError(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': subdomain
        },
        body: JSON.stringify(newCustomer)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create customer');
      }

      const data = await response.json();
      const createdCustomer = data.customer;

      onCustomerCreated(createdCustomer);
      onCustomerSelect(createdCustomer.id);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
      setShowNewCustomerForm(false);
      toast.success('Customer created successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-txt-primary uppercase tracking-wide text-xs">Customer</Label>
        {!showNewCustomerForm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowNewCustomerForm(true)}
            className="text-primary hover:bg-primary-light h-7 px-2 text-xs font-medium"
          >
            <i className='bx bx-plus mr-1'></i> New
          </Button>
        )}
      </div>

      {showNewCustomerForm ? (
        <form onSubmit={handleCreateCustomer} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          {error && !creatingCustomer && (
            <div className="text-xs text-danger bg-red-50 p-2 rounded border border-red-100">
              {error}
            </div>
          )}
          <Input
            placeholder="Full Name *"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
            required
          />
          <Input
            placeholder="Phone Number *"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
            required
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            className="bg-white border-gray-200 text-sm h-9 focus:border-primary focus:ring-primary/20"
          />
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={creatingCustomer || !newCustomer.name.trim() || !newCustomer.phone.trim()}
              className="h-9 flex-1 bg-primary hover:bg-primary-dark text-white shadow-sm"
            >
              {creatingCustomer ? <i className='bx bx-loader-lines bx-spin'></i> : 'Save Customer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCustomerForm(false)}
              className="h-9 bg-white text-txt-secondary hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="relative group">
          <i className='bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-lg group-focus-within:text-primary transition-colors'></i>
          <Input
            placeholder="Search by name or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="pl-10 h-10 bg-gray-50 border-transparent hover:bg-gray-100 focus:bg-white focus:border-primary focus:ring-primary/20 transition-all text-sm"
          />
          
          <div className="mt-2">
            <Select value={selectedCustomerId} onValueChange={onCustomerSelect}>
              <SelectTrigger className="w-full h-10 border-gray-200 text-txt-secondary focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers.length === 0 ? (
                  <div className="p-3 text-sm text-txt-muted text-center">No customers found</div>
                ) : (
                  filteredCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-txt-primary">{customer.name}</span>
                        <span className="text-xs text-txt-muted">{customer.phone}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedCustomer && !showNewCustomerForm && (
        <div className="flex items-start gap-3 p-3 bg-primary-light/30 border border-primary-light rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <i className='bx bx-user'></i>
          </div>
          <div>
            <div className="font-semibold text-primary text-sm">{selectedCustomer.name}</div>
            <div className="text-txt-secondary text-xs">{selectedCustomer.phone}</div>
          </div>
        </div>
      )}
    </div>
  );
}
