'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ImageIcon, RefreshCw, Upload, X, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddressInput } from '@/components/location/AddressInput';
import { SurchargeInput } from '@/components/settings/SurchargeInput';
import { TravelSurchargeSettings } from '@/types/location';

interface InvoiceSettingsProps {
  tenantId: string;
}

interface BrandingSettings {
  logoUrl: string;
  headerText: string;
  footerText: string;
  businessAddress: string;
  businessLatitude?: number;
  businessLongitude?: number;
}

interface TaxServiceChargeSettings {
  taxPercentage: number;
  serviceChargeType: 'fixed' | 'percentage';
  serviceChargeValue: number;
  serviceChargeRequired: boolean;
}

interface AdditionalFee {
  id: string;
  name: string;
  type: 'fixed' | 'percentage';
  value: number;
}

interface InvoiceSettingsForm {
  branding: BrandingSettings;
  taxServiceCharge: TaxServiceChargeSettings;
  travelSurcharge: TravelSurchargeSettings;
  additionalFees: AdditionalFee[];
}

const DEFAULT_FORM: InvoiceSettingsForm = {
  branding: {
    logoUrl: '',
    headerText: '',
    footerText: '',
    businessAddress: '',
    businessLatitude: undefined,
    businessLongitude: undefined,
  },
  taxServiceCharge: {
    taxPercentage: 0,
    serviceChargeType: 'fixed',
    serviceChargeValue: 0,
    serviceChargeRequired: false,
  },
  travelSurcharge: {
    baseTravelSurcharge: 0,
    perKmSurcharge: 5000,
    travelSurchargeRequired: true,
  },
  additionalFees: [],
};

export function InvoiceSettings({ tenantId }: InvoiceSettingsProps) {
  const [form, setForm] = useState<InvoiceSettingsForm>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<InvoiceSettingsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;

    let active = true;
    const controller = new AbortController();

    const loadSettings = async () => {
      try {
        setLoading(true);
        const url = new URL('/api/settings/invoice-config', window.location.origin);
        url.searchParams.set('tenantId', tenantId);

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load invoice settings');
        }

        const { settings } = await response.json();
        if (!active) return;

        const next: InvoiceSettingsForm = {
          branding: {
            logoUrl: settings?.branding?.logoUrl || '',
            headerText: settings?.branding?.headerText || '',
            footerText: settings?.branding?.footerText || '',
            businessAddress: settings?.branding?.businessAddress || '',
            businessLatitude: settings?.branding?.businessLatitude,
            businessLongitude: settings?.branding?.businessLongitude,
          },
          taxServiceCharge: {
            taxPercentage: settings?.taxServiceCharge?.taxPercentage || 0,
            serviceChargeType: settings?.taxServiceCharge?.serviceChargeType || 'fixed',
            serviceChargeValue: settings?.taxServiceCharge?.serviceChargeValue || 0,
            serviceChargeRequired: settings?.taxServiceCharge?.serviceChargeRequired || false,
          },
          travelSurcharge: {
            baseTravelSurcharge: settings?.travelSurcharge?.baseTravelSurcharge || 0,
            perKmSurcharge: settings?.travelSurcharge?.perKmSurcharge || 5000,
            minTravelDistance: settings?.travelSurcharge?.minTravelDistance,
            maxTravelDistance: settings?.travelSurcharge?.maxTravelDistance,
            travelSurchargeRequired: settings?.travelSurcharge?.travelSurchargeRequired ?? true,
          },
          additionalFees: settings?.additionalFees || [],
        };

        setForm(next);
        setInitialForm(next);
      } catch (error) {
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('[InvoiceSettings] load error:', error);
        toast.error('Tidak dapat memuat pengaturan invoice');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      active = false;
      controller.abort();
    };
  }, [tenantId]);

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

  const handleBrandingChange = (field: keyof BrandingSettings) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({
        ...prev,
        branding: { ...prev.branding, [field]: event.target.value }
      }));
    };

  const setBrandingCoords = (lat?: number, lng?: number) => {
    setForm(prev => ({
      ...prev,
      branding: { ...prev.branding, businessLatitude: lat, businessLongitude: lng }
    }));
  };

  const handleTaxServiceChargeChange = (field: keyof TaxServiceChargeSettings) =>
    (value: any) => {
      setForm(prev => ({
        ...prev,
        taxServiceCharge: { ...prev.taxServiceCharge, [field]: value }
      }));
    };

  const handleTravelSurchargeChange = (field: keyof TravelSurchargeSettings) =>
    (value: any) => {
      setForm(prev => ({
        ...prev,
        travelSurcharge: { ...prev.travelSurcharge, [field]: value }
      }));
    };

  const handleAddFee = () => {
    setForm(prev => ({
      ...prev,
      additionalFees: [
        ...prev.additionalFees,
        { id: Date.now().toString(), name: '', type: 'fixed', value: 0 }
      ]
    }));
  };

  const handleRemoveFee = (id: string) => {
    setForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.filter(fee => fee.id !== id)
    }));
  };

  const handleFeeChange = (id: string, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.map(fee =>
        fee.id === id ? { ...fee, [field]: value } : fee
      )
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/invoice-logo', {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(data.error || 'Failed to upload logo');
      }

      const { url } = await response.json();
      setForm(prev => ({
        ...prev,
        branding: { ...prev.branding, logoUrl: url }
      }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('[InvoiceSettings] upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({
      ...prev,
      branding: { ...prev.branding, logoUrl: '' }
    }));
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      const url = new URL('/api/settings/invoice-config', window.location.origin);
      url.searchParams.set('tenantId', tenantId);

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Gagal menyimpan pengaturan' }));
        throw new Error(data.error || 'Failed to save invoice settings');
      }

      const { settings } = await response.json();
      const next: InvoiceSettingsForm = {
        branding: {
          logoUrl: settings?.branding?.logoUrl || '',
          headerText: settings?.branding?.headerText || '',
          footerText: settings?.branding?.footerText || '',
          businessAddress: settings?.branding?.businessAddress || '',
        },
        taxServiceCharge: {
          taxPercentage: settings?.taxServiceCharge?.taxPercentage || 0,
          serviceChargeType: settings?.taxServiceCharge?.serviceChargeType || 'fixed',
          serviceChargeValue: settings?.taxServiceCharge?.serviceChargeValue || 0,
          serviceChargeRequired: settings?.taxServiceCharge?.serviceChargeRequired || false,
        },
        travelSurcharge: {
          baseTravelSurcharge: settings?.travelSurcharge?.baseTravelSurcharge || 0,
          perKmSurcharge: settings?.travelSurcharge?.perKmSurcharge || 5000,
          minTravelDistance: settings?.travelSurcharge?.minTravelDistance,
          maxTravelDistance: settings?.travelSurcharge?.maxTravelDistance,
          travelSurchargeRequired: settings?.travelSurcharge?.travelSurchargeRequired ?? true,
        },
        additionalFees: settings?.additionalFees || [],
      };

      setForm(next);
      setInitialForm(next);
      toast.success('Pengaturan invoice disimpan');
    } catch (error) {
      console.error('[InvoiceSettings] save error:', error);
      toast.error('Gagal menyimpan pengaturan invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Settings</CardTitle>
        <CardDescription>
          Atur logo, header, pajak, service charge, dan biaya tambahan untuk invoice PDF dan pratinjau.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="branding" className="space-y-6">
          <TabsList>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="charges">Pajak & Biaya</TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={handleLogoUpload}
                          disabled={loading || saving || uploading}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload">
                          <Button
                            asChild
                            variant="outline"
                            className="w-full cursor-pointer"
                            disabled={loading || saving || uploading}
                          >
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              {uploading ? 'Uploading...' : 'Upload Logo'}
                            </span>
                          </Button>
                        </label>
                      </div>
                      {form.branding.logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          disabled={loading || saving || uploading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {form.branding.logoUrl && !form.branding.logoUrl.startsWith('data:') && (
                      <p className="text-xs text-gray-500 break-all">
                        {form.branding.logoUrl}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Atau paste URL gambar publik di bawah. Format: PNG/JPG/WebP/SVG, Max 5MB.
                    </p>
                    <Input
                      placeholder="https://example.com/logo.png (optional)"
                      value={form.branding.logoUrl}
                      onChange={handleBrandingChange('logoUrl')}
                      disabled={loading || saving || uploading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-header">Header Kustom</Label>
                  <Input
                    id="invoice-header"
                    placeholder="Misal: Salon Bydirhaam"
                    value={form.branding.headerText}
                    onChange={handleBrandingChange('headerText')}
                    disabled={loading || saving}
                  />
                  <p className="text-xs text-gray-500">
                    Ditampilkan di bagian atas invoice sebagai nama bisnis.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-footer">Footer</Label>
                  <Textarea
                    id="invoice-footer"
                    placeholder="Terima kasih telah menggunakan layanan kami..."
                    value={form.branding.footerText}
                    onChange={handleBrandingChange('footerText')}
                    disabled={loading || saving}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Muncul di bagian bawah invoice sebagai catatan penutup.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Alamat Homebase</Label>
                  {/* Searchable address input using existing AddressInput */}
                  <div>
                    <AddressInput
                      label="Cari Alamat Homebase"
                      placeholder="Ketik alamat dan pilih dari daftar"
                      value={form.branding.businessAddress}
                      tenantId={tenantId}
                      onAddressSelect={(addr) => {
                        setForm(prev => ({
                          ...prev,
                          branding: {
                            ...prev.branding,
                            businessAddress: addr.fullAddress,
                          }
                        }));
                        setBrandingCoords(addr.coordinates?.lat, addr.coordinates?.lng);
                      }}
                      onAddressChange={(val) => {
                        setForm(prev => ({
                          ...prev,
                          branding: { ...prev.branding, businessAddress: val }
                        }));
                        // don't clear coords automatically to allow manual edits
                      }}
                      required={false}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="business-lat">Latitude</Label>
                      <Input
                        id="business-lat"
                        type="number"
                        step="0.000001"
                        value={typeof form.branding.businessLatitude === 'number' ? form.branding.businessLatitude : ''}
                        onChange={(e) => setBrandingCoords(e.target.value === '' ? undefined : Number(e.target.value), form.branding.businessLongitude)}
                        disabled={loading || saving}
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-lng">Longitude</Label>
                      <Input
                        id="business-lng"
                        type="number"
                        step="0.000001"
                        value={typeof form.branding.businessLongitude === 'number' ? form.branding.businessLongitude : ''}
                        onChange={(e) => setBrandingCoords(form.branding.businessLatitude, e.target.value === '' ? undefined : Number(e.target.value))}
                        disabled={loading || saving}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={loading || saving}
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => setBrandingCoords(pos.coords.latitude, pos.coords.longitude),
                              () => toast.error('Tidak dapat mengakses GPS browser'),
                              { enableHighAccuracy: true, timeout: 8000 }
                            );
                          } else {
                            toast.error('Browser tidak mendukung geolocation');
                          }
                        }}
                      >
                        Gunakan GPS Saat Ini
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gunakan pencarian untuk menentukan alamat, lalu koordinat akan terisi otomatis. Anda bisa mengedit lat/lng manual atau gunakan tombol GPS.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
                <div className="text-sm font-semibold text-gray-700">Pratinjau</div>
                <div className="rounded border bg-gray-50 p-6 space-y-4">
                  <div className="flex items-start gap-4">
                    {form.branding.logoUrl ? (
                      <img
                        src={form.branding.logoUrl}
                        alt="Logo"
                        className="h-16 w-16 object-contain border rounded bg-white"
                      />
                    ) : (
                      <div className="h-16 w-16 border rounded bg-white flex items-center justify-center text-gray-400">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-lg font-semibold">
                        {form.branding.headerText || 'Header invoice akan muncul di sini'}
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {form.branding.businessAddress || 'Alamat homebase akan ditampilkan di sini'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                    Konten invoice (detail pelanggan, item, total) akan tampil di area ini.
                  </div>

                  <div className="border-t pt-4 text-center text-sm text-gray-600">
                    {form.branding.footerText || 'Footer default: Terima kasih atas kepercayaan Anda!'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pajak & Biaya Tab */}
          <TabsContent value="charges" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {/* Tax */}
                <div className="space-y-2">
                  <Label htmlFor="tax">Pajak (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.taxServiceCharge.taxPercentage}
                    onChange={(e) => handleTaxServiceChargeChange('taxPercentage')(parseFloat(e.target.value) || 0)}
                    disabled={loading || saving}
                    placeholder="Contoh: 10"
                  />
                  <p className="text-xs text-gray-500">
                    Persentase pajak yang akan otomatis ditambahkan ke setiap invoice.
                  </p>
                </div>

                {/* Service Charge */}
                <div className="space-y-2">
                  <Label>Service Charge</Label>
                  <div className="flex gap-2 mb-2">
                    <Select
                      value={form.taxServiceCharge.serviceChargeType}
                      onValueChange={(value) =>
                        handleTaxServiceChargeChange('serviceChargeType')(value as 'fixed' | 'percentage')
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed (Rp)</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step={form.taxServiceCharge.serviceChargeType === 'percentage' ? '0.1' : '1000'}
                      value={form.taxServiceCharge.serviceChargeValue}
                      onChange={(e) =>
                        handleTaxServiceChargeChange('serviceChargeValue')(parseFloat(e.target.value) || 0)
                      }
                      disabled={loading || saving}
                      placeholder={form.taxServiceCharge.serviceChargeType === 'fixed' ? 'Rp' : '%'}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="service-charge-required"
                      checked={form.taxServiceCharge.serviceChargeRequired}
                      onCheckedChange={(checked) => {
                        const value = typeof checked === 'boolean' ? checked : false;
                        handleTaxServiceChargeChange('serviceChargeRequired')(value);
                      }}
                      disabled={loading || saving}
                    />
                    <Label htmlFor="service-charge-required" className="cursor-pointer text-sm">
                      Service Charge Wajib
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Jika wajib, otomatis ditambahkan ke setiap invoice.
                  </p>
                </div>

                {/* Travel Surcharge */}
                <div className="space-y-2 p-4 border rounded bg-blue-50">
                  <Label className="font-semibold text-blue-900">Travel Surcharge (Home Visit)</Label>
                  
                  <div className="space-y-3">
                    <SurchargeInput
                      id="base-travel"
                      label="Base Travel Surcharge (Rp)"
                      placeholder="Contoh: 25000"
                      value={form.travelSurcharge.baseTravelSurcharge}
                      onChange={(value) => handleTravelSurchargeChange('baseTravelSurcharge')(value)}
                      disabled={loading || saving}
                      min={0}
                      step={1000}
                      helperText="Base surcharge untuk setiap home visit, ditambahkan sebelum perhitungan per-km."
                    />

                    <SurchargeInput
                      id="per-km"
                      label="Per Kilometer (Rp/km)"
                      placeholder="Contoh: 5000"
                      value={form.travelSurcharge.perKmSurcharge}
                      onChange={(value) => handleTravelSurchargeChange('perKmSurcharge')(value)}
                      disabled={loading || saving}
                      min={0}
                      step={100}
                      helperText="Surcharge per kilometer jarak perjalanan. (Rp per km)"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="min-distance">Min Distance (km) - Optional</Label>
                        <Input
                          id="min-distance"
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.travelSurcharge.minTravelDistance || ''}
                          onChange={(e) =>
                            handleTravelSurchargeChange('minTravelDistance')(
                              e.target.value === '' ? undefined : parseFloat(e.target.value)
                            )
                          }
                          disabled={loading || saving}
                          placeholder="Contoh: 1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-distance">Max Distance (km) - Optional</Label>
                        <Input
                          id="max-distance"
                          type="number"
                          min="0"
                          step="0.1"
                          value={form.travelSurcharge.maxTravelDistance || ''}
                          onChange={(e) =>
                            handleTravelSurchargeChange('maxTravelDistance')(
                              e.target.value === '' ? undefined : parseFloat(e.target.value)
                            )
                          }
                          disabled={loading || saving}
                          placeholder="Contoh: 50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="travel-required"
                        checked={form.travelSurcharge.travelSurchargeRequired}
                        onCheckedChange={(checked) => {
                          const value = typeof checked === 'boolean' ? checked : false;
                          handleTravelSurchargeChange('travelSurchargeRequired')(value);
                        }}
                        disabled={loading || saving}
                      />
                      <Label htmlFor="travel-required" className="cursor-pointer text-sm">
                        Travel Surcharge Wajib
                      </Label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Jika diaktifkan, surcharge otomatis dihitung untuk semua home visit bookings.
                    </p>
                  </div>
                </div>

                {/* Additional Fees */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Biaya Tambahan</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddFee}
                      disabled={loading || saving}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {form.additionalFees.map((fee) => (
                      <div key={fee.id} className="flex gap-2 items-end p-3 border rounded bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nama biaya (e.g., Biaya Admin)"
                            value={fee.name}
                            onChange={(e) => handleFeeChange(fee.id, 'name', e.target.value)}
                            disabled={loading || saving}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Select
                              value={fee.type}
                              onValueChange={(value) =>
                                handleFeeChange(fee.id, 'type', value as 'fixed' | 'percentage')
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixed</SelectItem>
                                <SelectItem value="percentage">Percent</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              min="0"
                              step={fee.type === 'percentage' ? '0.1' : '1000'}
                              value={fee.value.toString()}
                              onChange={(e) =>
                                handleFeeChange(fee.id, 'value', parseFloat(e.target.value) || 0)
                              }
                              disabled={loading || saving}
                              placeholder={fee.type === 'fixed' ? 'Rp' : '%'}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFee(fee.id)}
                          disabled={loading || saving}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {form.additionalFees.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Tidak ada biaya tambahan</p>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
                <div className="text-sm font-semibold text-gray-700">Pratinjau Perhitungan</div>
                <div className="rounded border bg-gray-50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp 100.000</span>
                  </div>

                  {form.taxServiceCharge.taxPercentage > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Pajak {form.taxServiceCharge.taxPercentage}%</span>
                      <span>Rp {(100000 * form.taxServiceCharge.taxPercentage / 100).toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {form.taxServiceCharge.serviceChargeRequired && (
                    <div className="flex justify-between text-gray-600">
                      <span>Service Charge</span>
                      <span>
                        {form.taxServiceCharge.serviceChargeType === 'fixed'
                          ? `Rp ${form.taxServiceCharge.serviceChargeValue.toLocaleString('id-ID')}`
                          : `${form.taxServiceCharge.serviceChargeValue}% = Rp ${(100000 * form.taxServiceCharge.serviceChargeValue / 100).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  )}

                  {form.additionalFees.map((fee) => (
                    <div key={fee.id} className="flex justify-between text-gray-600">
                      <span>{fee.name}</span>
                      <span>
                        {fee.type === 'fixed'
                          ? `Rp ${fee.value.toLocaleString('id-ID')}`
                          : `${fee.value}% = Rp ${(100000 * fee.value / 100).toLocaleString('id-ID')}`}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total (Estimate)</span>
                    <span>
                      {(() => {
                        let total = 100000;
                        if (form.taxServiceCharge.taxPercentage > 0) {
                          total += 100000 * form.taxServiceCharge.taxPercentage / 100;
                        }
                        if (form.taxServiceCharge.serviceChargeRequired) {
                          if (form.taxServiceCharge.serviceChargeType === 'fixed') {
                            total += form.taxServiceCharge.serviceChargeValue;
                          } else {
                            total += 100000 * form.taxServiceCharge.serviceChargeValue / 100;
                          }
                        }
                        form.additionalFees.forEach(fee => {
                          if (fee.type === 'fixed') {
                            total += fee.value;
                          } else {
                            total += 100000 * fee.value / 100;
                          }
                        });
                        return `Rp ${total.toLocaleString('id-ID')}`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
                  <p>
                    <strong>Include Mode:</strong> Semua biaya ditambah ke total (dibayarkan bersama)
                  </p>
                  <p>
                    <strong>Exclude Mode:</strong> User pilih biaya mana saja yang mau ditambahkan per invoice
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4 mt-6">
          <Button
            onClick={handleSave}
            disabled={loading || saving || !hasChanges}
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading || saving || !hasChanges}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Batalkan Perubahan
          </Button>
          <p className="text-xs text-gray-500">
            Perubahan akan langsung mempengaruhi invoice yang dibuat setelahnya.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvoiceSettings;
