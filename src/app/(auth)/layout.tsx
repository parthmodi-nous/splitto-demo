import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        {children}
      </div>
      <Toaster richColors position="top-center" />
    </Providers>
  );
}
