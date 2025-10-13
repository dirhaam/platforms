import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BusinessProfileSettings from './BusinessProfileSettings';
import LandingPageSettings from './LandingPageSettings';
import ServiceSettings from './ServiceSettings';
import BusinessHoursSettings from './BusinessHoursSettings';
import NotificationSettings from './NotificationSettings';
import type { TenantSession } from '@/lib/auth/types';
import { SettingsService } from '@/lib/settings/settings-service';

interface TenantSettingsProps {
  session: TenantSession;
}

export default async function TenantSettings({ session }: TenantSettingsProps) {
  // Get current settings
  const [
    businessProfile,
    services,
    businessHours,
    landingPageSettings,
    notificationSettings,
  ] = await Promise.all([
    SettingsService.getBusinessProfile(session.tenantId),
    SettingsService.getServices(session.tenantId),
    SettingsService.getBusinessHours(session.tenantId),
    SettingsService.getLandingPageSettings(session.tenantId),
    SettingsService.getNotificationSettings(session.tenantId),
  ]);

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="profile">Business Profile</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="hours">Business Hours</TabsTrigger>
        <TabsTrigger value="landing">Landing Page</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Update your business information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessProfileSettings 
              tenantId={session.tenantId}
              initialData={businessProfile}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Service Management</CardTitle>
            <CardDescription>
              Manage your service offerings, pricing, and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ServiceSettings 
              tenantId={session.tenantId}
              initialServices={services}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hours" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>
              Set your operating hours and availability schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BusinessHoursSettings 
              tenantId={session.tenantId}
              initialData={businessHours}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="landing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Landing Page Customization</CardTitle>
            <CardDescription>
              Customize your business landing page appearance and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LandingPageSettings 
              tenantId={session.tenantId}
              initialData={landingPageSettings}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettings 
              tenantId={session.tenantId}
              initialData={notificationSettings}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}