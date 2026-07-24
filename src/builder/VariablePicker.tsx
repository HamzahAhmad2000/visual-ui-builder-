'use client';

import React, { useMemo, useState } from 'react';
import { Search, Braces } from 'lucide-react';
import { ThemedInput } from '../ui/primitives';

/**
 * A merge field offered to text-bearing blocks. Structurally compatible with
 * `EmailTemplateVariableDefinition` so the email catalog can be passed straight
 * through, while keeping this module free of email-specific imports.
 */
export interface TemplateVariable {
  name: string;
  placeholder: string;
  description?: string;
  example?: string;
  /** Optional grouping label, e.g. "Recipient" or "Order". */
  group?: string;
}

interface VariablePickerProps {
  variables: TemplateVariable[];
  /**
   * Called with the placeholder when a chip is clicked. Insertion happens on
   * `mousedown` so the target editor still holds its caret.
   */
  onInsert: (placeholder: string) => void;
  /** Shown when the picker cannot insert (no editor focused yet). */
  hint?: string;
}

/**
 * Searchable, grouped list of merge fields. Clicking one inserts it at the
 * caret in the active editor rather than appending to the end.
 */
export function VariablePicker({ variables, onInsert, hint }: VariablePickerProps) {
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = query
      ? variables.filter(
          (variable) =>
            variable.name.toLowerCase().includes(query) ||
            variable.placeholder.toLowerCase().includes(query) ||
            (variable.description || '').toLowerCase().includes(query)
        )
      : variables;

    const byGroup = new Map<string, TemplateVariable[]>();
    for (const variable of matches) {
      const key = variable.group || 'General';
      byGroup.set(key, [...(byGroup.get(key) || []), variable]);
    }
    return Array.from(byGroup.entries());
  }, [variables, search]);

  if (variables.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
        <ThemedInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variables..."
          className="pl-8 text-xs"
        />
      </div>

      {hint && <p className="text-[10px] text-[var(--text-secondary)]">{hint}</p>}

      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {grouped.length === 0 && (
          <p className="py-3 text-center text-[11px] text-[var(--text-secondary)]">
            No variables match “{search}”.
          </p>
        )}

        {grouped.map(([group, items]) => (
          <div key={group} className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {group}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {items.map((variable) => (
                <button
                  key={variable.placeholder}
                  type="button"
                  // mousedown fires before the editor blurs, so the saved caret
                  // is still the one the user is looking at.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onInsert(variable.placeholder);
                  }}
                  title={
                    variable.description
                      ? `${variable.description}${
                          variable.example ? ` — e.g. ${variable.example}` : ''
                        }`
                      : variable.placeholder
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700 transition-colors hover:border-purple-400 hover:bg-purple-100"
                >
                  <Braces className="h-3 w-3" />
                  {variable.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
