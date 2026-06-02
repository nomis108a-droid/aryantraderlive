
import { UserProfileClient } from "./profile-client";

/**
 * Generate static params for static export.
 * Returning an empty array allows the build to succeed for dynamic client-side routes.
 */
export async function generateStaticParams() {
  return [];
}

export default async function Page({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = await params;
  return <UserProfileClient uid={resolvedParams.uid} />;
}
