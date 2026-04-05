import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { groupInvites, groups, users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { getAvatarColorClasses } from '@/lib/constants';
import { getInitials, cn } from '@/lib/utils';
import { AcceptInviteButton } from '@/app/invite/[token]/accept-invite-button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const currentUser = await getCurrentUser();

  // Look up invite by token
  const [invite] = await db
    .select()
    .from(groupInvites)
    .where(eq(groupInvites.token, token))
    .limit(1);

  // Invalid invite
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
              ❌
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>
              This invite link is invalid or does not exist. Please ask for a new link.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/groups">Go to Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired
  const now = new Date();
  if (invite.expiresAt < now) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
              ⏰
            </div>
            <CardTitle>Invite Expired</CardTitle>
            <CardDescription>
              This invite link expired on{' '}
              {invite.expiresAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              . Please ask for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/groups">Go to Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Max uses reached
  if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
              🚫
            </div>
            <CardTitle>Invite Limit Reached</CardTitle>
            <CardDescription>
              This invite link has reached its maximum number of uses. Please ask for a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/groups">Go to Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch group and inviter info
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, invite.groupId))
    .limit(1);

  const [inviter] = await db
    .select()
    .from(users)
    .where(eq(users.id, invite.createdBy))
    .limit(1);

  if (!group || !inviter) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>Unable to load group information.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/groups">Go to Groups</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inviterColors = getAvatarColorClasses(inviter.avatarColor);
  const currentUserColors = currentUser ? getAvatarColorClasses(currentUser.avatarColor) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            👋
          </div>
          <CardTitle className="text-xl">You&apos;re invited!</CardTitle>
          <CardDescription className="text-base">
            Join{' '}
            <span className="font-semibold text-foreground">{group.name}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Inviter info */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <div
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold select-none shrink-0',
                inviterColors.bg,
                inviterColors.text,
              )}
            >
              {getInitials(inviter.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Invited by</p>
              <p className="text-sm font-medium text-foreground truncate">{inviter.name}</p>
            </div>
          </div>

          {/* Group description */}
          {group.description && (
            <p className="text-sm text-muted-foreground text-center">{group.description}</p>
          )}

          {/* Current user info */}
          {currentUser ? (
            <div className="rounded-lg border border-border px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">You&apos;ll join as:</p>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold select-none shrink-0',
                    currentUserColors!.bg,
                    currentUserColors!.text,
                  )}
                >
                  {getInitials(currentUser.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground text-center">
              Please sign in to join this group.
            </div>
          )}

          {/* Join button */}
          <AcceptInviteButton
            token={token}
            groupId={group.id}
            disabled={!currentUser}
          />

          <p className="text-xs text-muted-foreground text-center">
            Link expires{' '}
            {invite.expiresAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            {invite.maxUses !== null &&
              ` · ${invite.maxUses - invite.useCount} use${invite.maxUses - invite.useCount === 1 ? '' : 's'} remaining`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
