import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { Providers } from '@/components/providers';
import { getUserGroups } from '@/actions/groups';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const groupsResult = await getUserGroups().catch(() => ({ success: false as const, error: 'Failed' }));
  const groups = groupsResult.success ? groupsResult.data.map((g) => ({ id: g.id, name: g.name })) : [];

  return (
    <Providers>
      <div className="flex min-h-screen overflow-x-hidden">
        <Sidebar groups={groups} />
        <main className="flex-1 flex flex-col min-h-screen w-0 pb-16 lg:pb-0 lg:ml-64 overflow-x-hidden">
          <Header />
          <div className="flex-1 overflow-x-hidden">
            <PageTransition>
              <Suspense>{children}</Suspense>
            </PageTransition>
          </div>
        </main>
      </div>
      <MobileNav />
      <Toaster richColors position="top-center" />
    </Providers>
  );
}
