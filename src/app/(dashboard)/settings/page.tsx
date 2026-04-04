import { getCurrentUser } from '@/lib/auth';
import { getAllUsers } from '@/actions/users';
import { PageHeader } from '@/components/shared/page-header';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials as getInitialsUtil } from '@/lib/utils';
import { CURRENCIES } from '@/lib/currencies';

export default async function SettingsPage() {
  const [currentUser, allUsersResult] = await Promise.all([
    getCurrentUser(),
    getAllUsers(),
  ]);

  const allUsers = allUsersResult.success ? allUsersResult.data : [];
  const currencyInfo = currentUser
    ? (CURRENCIES[currentUser.defaultCurrency] ?? null)
    : null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences"
      />

      {/* Current user info */}
      {currentUser ? (
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
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                User ID
              </p>
              <p className="text-sm text-foreground font-mono break-all">{currentUser.id}</p>
            </div>
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
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">No user selected. Please select a demo user below.</p>
        </section>
      )}

      {/* Default currency preference */}
      {currentUser && (
        <section className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Default Currency</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <span className="text-base">{currencyInfo?.symbol ?? '$'}</span>
              <span className="text-sm font-medium text-foreground">
                {currentUser.defaultCurrency}
              </span>
              {currencyInfo && (
                <span className="text-xs text-muted-foreground">— {currencyInfo.name}</span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This is your preferred currency for new groups and expenses. Change it via the user
            preferences when real auth is implemented.
          </p>
        </section>
      )}

      {/* Demo user info */}
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-base shrink-0">
            ℹ️
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Demo Auth System</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              SplitLedger uses a mock authentication system for demo purposes. There is no sign-in
              or password — you simply pick which demo user to act as. Your selection is stored in
              a browser cookie and persists across page loads.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            User Switcher
          </p>
          <p className="text-sm text-muted-foreground">
            Use the user switcher in the sidebar (or the dropdown at the top of the navigation) to
            switch between demo users. Each user has their own groups, expenses, and balances.
          </p>
        </div>

        {/* List available users */}
        {allUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Available Demo Users
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allUsers.map((u) => {
                const avatarClasses = getAvatarColorClasses(u.avatarColor);
                const isActive = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                      isActive
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarClasses.bg} ${avatarClasses.text}`}
                    >
                      {getInitialsUtil(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    {isActive && (
                      <span className="text-xs font-medium text-primary shrink-0">Active</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
