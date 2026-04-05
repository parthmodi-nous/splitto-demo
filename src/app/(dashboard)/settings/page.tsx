import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/shared/page-header';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials as getInitialsUtil } from '@/lib/utils';
import { CURRENCIES } from '@/lib/currencies';

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();
  const currencyInfo = currentUser
    ? (CURRENCIES[currentUser.defaultCurrency] ?? null)
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences"
      />

      {currentUser ? (
        <>
          {/* Account info */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Your Account</h2>
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${getAvatarColorClasses(currentUser.avatarColor).bg} ${getAvatarColorClasses(currentUser.avatarColor).text}`}
              >
                {getInitialsUtil(currentUser.name)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-base">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground truncate">{currentUser.email}</p>
                {currentUser.emailVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Member since
                </p>
                <p className="text-sm text-foreground">
                  {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Default Currency
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">
                    {currencyInfo?.symbol ?? '$'} {currentUser.defaultCurrency}
                  </span>
                  {currencyInfo && (
                    <span className="text-xs text-muted-foreground">— {currencyInfo.name}</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Unable to load account information.</p>
        </section>
      )}
    </div>
  );
}
