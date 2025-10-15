import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/auth-middleware';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { TenantCreationForm } from '@/components/admin/TenantCreationForm';

export default async function CreateTenantPage() {
  const session = await getServerSession();

  // Redirect if not authenticated or not superadmin
  if (!session || session.role !== 'superadmin' || !session.isSuperAdmin) {
    redirect('/login?type=superadmin');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/tenants">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenants
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Tenant</h1>
          <p className="text-gray-600">
            Add a new tenant to the platform
          </p>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div className="text-sm text-yellow-800">
            <strong>Testing Notice:</strong> This is a development environment. 
            Create test tenants with placeholder data to validate the functionality.
          </div>
        </div>
      </div>

      <TenantCreationForm session={session} />
    </div>
  );
}