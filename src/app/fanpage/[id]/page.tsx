
import { FanPageProfileClient } from "./fan-page-client";

/**
 * Generate static params for static export. 
 * Returning an empty array allows the build to succeed for dynamic client-side routes.
 */
export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <FanPageProfileClient id={resolvedParams.id} />;
}
