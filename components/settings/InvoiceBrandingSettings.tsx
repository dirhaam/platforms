'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ImageIcon, RefreshCw, Upload, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface InvoiceBrandingSettingsProps {
  tenantId: string;
}

interface BrandingFormState {
  logoUrl: string;
  headerText: string;
  footerText: string;
  showBusinessName: boolean;
  showHeaderText: boolean;
}

const DEFAULT_FORM: BrandingFormState = {
  logoUrl: '',
  headerText: '',
  footerText: '',
  showBusinessName: true,
  showHeaderText: true,
};

export function InvoiceBrandingSettings({ tenantId }: InvoiceBrandingSettingsProps) {
  const [form, setForm] = useState<BrandingFormState>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<BrandingFormState>(DEFAULT_FORM);
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
        const url = new URL('/api/settings/invoice', window.location.origin);
        url.searchParams.set('tenantId', tenantId);

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Failed to load invoice settings');
        }

        const { settings } = await response.json();
        if (!active) return;

        const next: BrandingFormState = {
          logoUrl: settings?.logoUrl || '',
          headerText: settings?.headerText || '',
          footerText: settings?.footerText || '',
          showBusinessName: settings?.showBusinessName !== false,
          showHeaderText: settings?.showHeaderText !== false,
        };

        setForm(next);
        setInitialForm(next);
      } catch (error) {
        if ((error as any)?.name === 'AbortError') {
          return;
        }
        console.error('[InvoiceBranding] load error:', error);
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

  const handleInputChange = (field: keyof BrandingFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: event.target.value }));
    };

  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);
    try {
      const url = new URL('/api/settings/invoice', window.location.origin);
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
      const next: BrandingFormState = {
        logoUrl: settings?.logoUrl || '',
        headerText: settings?.headerText || '',
        footerText: settings?.footerText || '',
        showBusinessName: settings?.showBusinessName !== false,
        showHeaderText: settings?.showHeaderText !== false,
      };

      setForm(next);
      setInitialForm(next);
      toast.success('Pengaturan invoice disimpan');
    } catch (error) {
      console.error('[InvoiceBranding] save error:', error);
      toast.error('Gagal menyimpan pengaturan invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
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
      setForm(prev => ({ ...prev, logoUrl: url }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('[InvoiceBranding] upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveLogo = () => {
    setForm(prev => ({ ...prev, logoUrl: '' }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Branding</CardTitle>
        <CardDescription>
          Atur logo, header, dan footer yang akan tampil pada invoice PDF maupun pratinjau.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  {form.logoUrl && (
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
                {form.logoUrl && !form.logoUrl.startsWith('data:') && (
                  <p className="text-xs text-gray-500 break-all">
                    {form.logoUrl}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Atau paste URL gambar publik di bawah. Format: PNG/JPG/WebP/SVG, Max 5MB.
                </p>
                <Input
                  placeholder="https://example.com/logo.png (optional)"
                  value={form.logoUrl}
                  onChange={handleInputChange('logoUrl')}
                  disabled={loading || saving || uploading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-header">Header Kustom</Label>
              <Textarea
                id="invoice-header"
                placeholder="Misal: PT Contoh Sukses - Invoice Resmi"
                value={form.headerText}
                onChange={handleInputChange('headerText')}
                disabled={loading || saving}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Ditampilkan di bagian atas invoice, tepat di bawah logo. Boleh dikosongkan jika tidak diperlukan.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-footer">Footer</Label>
              <Textarea
                id="invoice-footer"
                placeholder="Terima kasih telah menggunakan layanan kami. Transfer ke rekening ..."
                value={form.footerText}
                onChange={handleInputChange('footerText')}
                disabled={loading || saving}
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Muncul di bagian bawah invoice sebagai catatan penutup atau informasi pembayaran tambahan.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-header-text"
                    checked={form.showHeaderText}
                    onCheckedChange={(checked) => {
                      const value = typeof checked === 'boolean' ? checked : false;
                      setForm(prev => ({ ...prev, showHeaderText: value }));
                    }}
                    disabled={loading || saving}
                  />
                  <Label htmlFor="show-header-text" className="cursor-pointer">
                    Tampilkan Header Kustom di Invoice
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Jika dinonaktifkan, header kustom tidak akan ditampilkan di invoice.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="show-business-name"
                    checked={form.showBusinessName}
                    onCheckedChange={(checked) => {
                      const value = typeof checked === 'boolean' ? checked : false;
                      setForm(prev => ({ ...prev, showBusinessName: value }));
                    }}
                    disabled={loading || saving}
                  />
                  <Label htmlFor="show-business-name" className="cursor-pointer">
                    Tampilkan Nama Bisnis di Invoice
                  </Label>
                </div>
                <p className="text-xs text-gray-500">
                  Jika dinonaktifkan, nama bisnis tidak akan ditampilkan di invoice.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
            <div className="text-sm font-semibold text-gray-700">Pratinjau</div>
            <div className="rounded border bg-gray-50 p-6 space-y-4">
              <div className="flex items-start gap-4">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="h-16 w-16 object-contain border rounded bg-white"
                  />
                ) : (
                  <div className="h-16 w-16 border rounded bg-white flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  {form.showHeaderText ? (
                    form.headerText ? (
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        {form.headerText}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Header kustom akan ditampilkan di sini</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-400 italic">Header kustom disembunyikan</p>
                  )}
                  {form.showBusinessName ? (
                    <>
                      <p className="text-lg font-semibold">Nama Bisnis Anda</p>
                      <p className="text-sm text-gray-600">Alamat, Telepon, Email dari profil</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nama bisnis disembunyikan</p>
                  )}
                </div>
              </div>

              <div className="rounded border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                Konten invoice (detail pelanggan, item, total, dan QR code) akan tampil di area ini.
              </div>

              <div className="border-t pt-4 text-center text-sm text-gray-600">
                {form.footerText || 'Footer default: Terima kasih atas kepercayaan Anda!'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
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
            Perubahan akan langsung mempengaruhi PDF invoice dan pratinjau setelah penyimpanan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvoiceBrandingSettings;
