import { ReceiptText } from 'lucide-react';
import Link from 'next/link';
import { UserSwitcher } from './user-switcher';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 gap-4">
      {/* Mobile logo */}
      <Link
        href="/"
        className="flex items-center gap-2 lg:hidden shrink-0"
        aria-label="SplitLedger home"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
          <ReceiptText className="w-4 h-4" />
        </div>
        <span className="font-bold text-sm text-foreground">SplitLedger</span>
      </Link>

      {/* Page title */}
      {title && (
        <h1 className="text-base font-semibold text-foreground hidden sm:block truncate flex-1">
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <UserSwitcher />
      </div>
    </header>
  );
}
