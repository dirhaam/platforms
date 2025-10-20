export const dynamic = 'force-dynamic';

import { ServiceEditContent } from './content';

export default function ServiceEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ subdomain?: string }>;
}) {
  return <ServiceEditContent params={params} searchParams={searchParams} />;
}
