export const dynamic = 'force-dynamic';

import { ServiceEditContent } from './content';

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ServiceEditContent serviceId={resolvedParams.id} />;
}
