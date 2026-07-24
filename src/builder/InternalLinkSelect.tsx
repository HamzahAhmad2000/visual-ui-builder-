'use client';

import { useMemo, useState } from 'react';
import { Link2, Globe } from 'lucide-react';
import { ThemedInput } from '../ui/primitives';
import {
  ThemedSelect,
  ThemedSelectContent,
  ThemedSelectItem,
  ThemedSelectTrigger,
  ThemedSelectValue,
} from '../ui/primitives';

export interface InternalPageOption {
  label: string;
  path: string;
  group: string;
}

/**
 * Curated list of in-app destinations that can be auto-populated into link
 * fields (announcement action buttons, pop-up CTA buttons, builder buttons).
 * Replace or extend these defaults with your host app's routes when needed.
 */
export const INTERNAL_PAGES: InternalPageOption[] = [
  { label: 'Dashboard Home', path: '/dashboard', group: 'General' },
  { label: 'Announcements', path: '/dashboard/announcements', group: 'General' },
  { label: 'Pop-Up News', path: '/dashboard/popup-news', group: 'General' },
  { label: 'Surveys', path: '/dashboard/surveys', group: 'General' },
  { label: 'Forms', path: '/dashboard/forms', group: 'General' },
  { label: 'Docs', path: '/dashboard/docs', group: 'General' },
  { label: 'Tutorials', path: '/dashboard/tutorials', group: 'General' },
  { label: 'Support', path: '/dashboard/support', group: 'General' },
  { label: 'Reviews', path: '/dashboard/reviews', group: 'General' },
  { label: 'Jobs', path: '/dashboard/jobs', group: 'Operations' },
  { label: 'My Jobs', path: '/dashboard/my-jobs', group: 'Operations' },
  { label: 'Routes', path: '/dashboard/routes', group: 'Operations' },
  { label: 'Route Planning', path: '/dashboard/route-planning', group: 'Operations' },
  { label: 'Fleet', path: '/dashboard/fleet', group: 'Operations' },
  { label: 'Vehicles', path: '/dashboard/vehicles', group: 'Operations' },
  { label: 'Drivers', path: '/dashboard/drivers', group: 'Operations' },
  { label: 'Driver Jobs', path: '/dashboard/driver-jobs', group: 'Operations' },
  { label: 'Maintenance', path: '/dashboard/maintenance', group: 'Operations' },
  { label: 'Inspections', path: '/dashboard/inspections', group: 'Operations' },
  { label: 'Issues', path: '/dashboard/issues', group: 'Operations' },
  { label: 'Disputes', path: '/dashboard/disputes', group: 'Operations' },
  { label: 'Merchants', path: '/dashboard/merchants', group: 'Partners' },
  { label: 'Merchant Analytics', path: '/dashboard/merchant-analytics', group: 'Partners' },
  { label: 'Operators', path: '/dashboard/operators', group: 'Partners' },
  { label: 'Users', path: '/dashboard/users', group: 'Admin' },
  { label: 'Groups', path: '/dashboard/groups', group: 'Admin' },
  { label: 'Settings', path: '/dashboard/settings', group: 'Admin' },
  { label: 'Pricing', path: '/dashboard/pricing', group: 'Admin' },
  { label: 'Subscriptions', path: '/dashboard/subscriptions', group: 'Admin' },
  { label: 'Email Templates', path: '/dashboard/email-templates', group: 'Admin' },
  { label: 'SMS Templates', path: '/dashboard/sms-templates', group: 'Admin' },
  { label: 'Analytics', path: '/dashboard/analytics', group: 'Admin' },
];

const CUSTOM_VALUE = '__custom__';

interface InternalLinkSelectProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  /** Extra options (e.g. per-tenant surveys) appended under their own group. */
  extraOptions?: InternalPageOption[];
}

/**
 * URL field with an internal-page dropdown: choosing a page auto-populates the
 * link; "Custom URL" keeps the free-text input for external destinations.
 */
export function InternalLinkSelect({
  value,
  onChange,
  placeholder = 'https://example.com or /dashboard/...',
  extraOptions = [],
}: InternalLinkSelectProps) {
  const options = useMemo(() => [...INTERNAL_PAGES, ...extraOptions], [extraOptions]);
  const matched = options.find((option) => option.path === value);
  const [mode, setMode] = useState<string>(matched ? matched.path : CUSTOM_VALUE);

  const groups = useMemo(() => {
    const map = new Map<string, InternalPageOption[]>();
    options.forEach((option) => {
      const list = map.get(option.group) || [];
      list.push(option);
      map.set(option.group, list);
    });
    return Array.from(map.entries());
  }, [options]);

  const handleSelect = (next: string) => {
    setMode(next);
    if (next !== CUSTOM_VALUE) {
      onChange(next);
    }
  };

  return (
    <div className="space-y-2">
      <ThemedSelect value={matched ? matched.path : mode} onValueChange={handleSelect}>
        <ThemedSelectTrigger>
          <ThemedSelectValue placeholder="Choose an internal page" />
        </ThemedSelectTrigger>
        <ThemedSelectContent>
          <ThemedSelectItem value={CUSTOM_VALUE}>
            <span className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Custom URL
            </span>
          </ThemedSelectItem>
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                {group}
              </p>
              {items.map((option) => (
                <ThemedSelectItem key={option.path} value={option.path}>
                  <span className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5" />
                    {option.label}
                  </span>
                </ThemedSelectItem>
              ))}
            </div>
          ))}
        </ThemedSelectContent>
      </ThemedSelect>
      <ThemedInput
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          const hit = options.find((option) => option.path === e.target.value);
          setMode(hit ? hit.path : CUSTOM_VALUE);
        }}
        maxLength={512}
        placeholder={placeholder}
      />
    </div>
  );
}
