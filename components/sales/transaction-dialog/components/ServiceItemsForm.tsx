"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { TransactionItem } from "../types";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface ServiceItemsFormProps {
  items: TransactionItem[];
  services: Service[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: keyof TransactionItem, value: any) => void;
  getServicePrice: (serviceId: string) => number;
}

export function ServiceItemsForm({
  items,
  services,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  getServicePrice,
}: ServiceItemsFormProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Services *</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add Service
        </Button>
      </div>
      <div className="space-y-3 p-3 border rounded-md bg-gray-50">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No services added yet</p>
        ) : (
          items.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-1 sm:gap-2 items-end border-b pb-2 sm:pb-3"
            >
              <div className="col-span-6 sm:col-span-6">
                <Label className="text-xs">Service</Label>
                <Select
                  value={item.serviceId}
                  onValueChange={(value) => {
                    onUpdateItem(index, "serviceId", value);
                    const price = getServicePrice(value);
                    onUpdateItem(index, "unitPrice", price);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    onUpdateItem(index, "quantity", parseInt(e.target.value) || 1)
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="col-span-3 sm:col-span-3">
                <Label className="text-xs">Price (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    onUpdateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                  }
                  className="h-8 text-xs"
                />
              </div>
              <div className="col-span-1 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
