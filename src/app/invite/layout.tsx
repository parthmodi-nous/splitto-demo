import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <Toaster richColors position="top-right" />
    </Providers>
  );
}
