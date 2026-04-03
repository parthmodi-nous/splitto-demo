export const MOCK_USER_COOKIE = 'splitledger-current-user';
export const DARK_MODE_COOKIE = 'splitledger-theme';

export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Drink', icon: '🍔' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'health', label: 'Health', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const;

export const SPLIT_TYPES = [
  { value: 'equal', label: 'Equal' },
  { value: 'exact', label: 'Exact' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'shares', label: 'Shares' },
  { value: 'adjustment', label: 'Adjustment' },
] as const;

export const MEMBER_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
] as const;

export const AVATAR_COLORS = [
  { value: 'emerald', bg: 'bg-emerald-500', text: 'text-white' },
  { value: 'blue', bg: 'bg-blue-500', text: 'text-white' },
  { value: 'purple', bg: 'bg-purple-500', text: 'text-white' },
  { value: 'amber', bg: 'bg-amber-500', text: 'text-white' },
  { value: 'rose', bg: 'bg-rose-500', text: 'text-white' },
  { value: 'cyan', bg: 'bg-cyan-500', text: 'text-white' },
  { value: 'orange', bg: 'bg-orange-500', text: 'text-white' },
  { value: 'teal', bg: 'bg-teal-500', text: 'text-white' },
] as const;

export function getAvatarColorClasses(color: string): { bg: string; text: string } {
  const found = AVATAR_COLORS.find((c) => c.value === color);
  return found ? { bg: found.bg, text: found.text } : { bg: 'bg-slate-500', text: 'text-white' };
}
