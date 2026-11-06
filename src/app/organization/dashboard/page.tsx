'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/organizer');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
        <span className="font-mono text-sm text-text-muted">Navigating to Organizer Portal...</span>
      </div>
    </div>
  );
}
