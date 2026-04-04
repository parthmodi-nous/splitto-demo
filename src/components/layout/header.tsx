import { ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { UserSwitcher } from './user-switcher';

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border glass px-4 gap-3 shrink-0">
      {/* Mobile logo — hidden on desktop (sidebar handles it) */}
      <Link
        href="/"
        className="flex items-center gap-2 lg:hidden shrink-0"
        aria-label="SplitLedger home"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-lg gradient-violet text-white shadow-sm">
          <ReceiptText className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-sm text-foreground tracking-tight">SplitLedger</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <UserSwitcher />
      </div>
    </header>
  );
}
