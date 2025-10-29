'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ImageIcon, RefreshCw } from 'lucide-react';

interface InvoiceBrandingSettingsProps {
  tenantId: string;
}

interface BrandingFormState {
  logoUrl: string;
  headerText: string;
  footerText: string;
}

const DEFAULT_FORM: BrandingFormState = {
  logoUrl: '',
  headerText: '',
  footerText: '',
};

export function InvoiceBrandingSettings({ tenantId }: InvoiceBrandingSettingsProps) {
  const [form, setForm] = useState<BrandingFormState>(DEFAULT_FORM);
  const [initialForm, setInitialForm] = useState<BrandingFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
              <Label htmlFor="invoice-logo">Logo URL</Label>
              <Input
                id="invoice-logo"
                placeholder="https://example.com/logo.png"
                value={form.logoUrl}
                onChange={handleInputChange('logoUrl')}
                disabled={loading || saving}
              />
              <p className="text-xs text-gray-500">
                Gunakan tautan gambar (PNG/JPG) yang dapat diakses publik. Logo akan ditampilkan di bagian atas invoice.
              </p>
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
                <div className="flex-1">
                  <p className="text-lg font-semibold">
                    {form.headerText || 'Header invoice akan muncul di sini'}
                  </p>
                  <p className="text-sm text-gray-600">Nama bisnis dan informasi kontak tetap akan ditampilkan dari profil tenant.</p>
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
