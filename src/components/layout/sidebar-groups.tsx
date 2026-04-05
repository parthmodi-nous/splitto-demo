import { getUserGroups } from '@/actions/groups';
import { Sidebar } from './sidebar';

// Fetches groups server-side and passes them to the sidebar.
// Rendered inside a Suspense boundary so it doesn't block the layout.
export async function SidebarWithGroups() {
  const result = await getUserGroups().catch(() => ({ success: false as const, error: '' }));
  const groups = result.success ? result.data.map((g) => ({ id: g.id, name: g.name })) : [];
  return <Sidebar groups={groups} />;
}
