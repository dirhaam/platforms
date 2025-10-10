import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';

export default function PlatformAnalyticsPage() {
  // For platform admin, we use a special tenant ID
  return (
    <div className="container mx-auto py-6">
      <AnalyticsPage tenantId="platform" isAdmin={true} />
    </div>
  );
}