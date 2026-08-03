'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        const roleSlug = user?.role?.slug;
        if (roleSlug === 'super_admin') {
          router.push('/dashboard/super-admin');
        } else if (roleSlug === 'complex_admin') {
          router.push('/dashboard/complex-admin');
        } else {
          router.push('/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <span className="text-sm font-medium">Redirecting to portal...</span>
    </div>
  );
}
