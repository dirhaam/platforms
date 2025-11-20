export const dynamic = 'force-dynamic';

import { StaffDetailContent } from './content';

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <StaffDetailContent staffId={resolvedParams.id} />;
}
