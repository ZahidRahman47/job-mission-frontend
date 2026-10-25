import {
  BarChart3,
  Bell,
  Building2,
  Columns3,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const NAV: NavItem[] = [
  { href: '/today', label: 'Today', icon: LayoutDashboard, shortcut: 'G T' },
  { href: '/applications', label: 'Applications', icon: ListChecks, shortcut: 'G A' },
  { href: '/board', label: 'Board', icon: Columns3, shortcut: 'G B' },
  { href: '/reminders', label: 'Reminders', icon: Bell, shortcut: 'G R' },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
];
