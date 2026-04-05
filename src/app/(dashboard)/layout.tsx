import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarWithGroups } from '@/components/layout/sidebar-groups';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { PageTransition } from '@/components/layout/page-transition';
import { Providers } from '@/components/providers';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen overflow-x-hidden">
        {/*
          Sidebar streams in independently — groups are fetched inside SidebarWithGroups.
          The empty <Sidebar /> fallback renders instantly so the layout skeleton
          is visible before the DB responds.
        */}
        <Suspense fallback={<Sidebar groups={[]} />}>
          <SidebarWithGroups />
        </Suspense>

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
