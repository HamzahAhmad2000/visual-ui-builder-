'use client';

import {
  createVisualTemplateRecord,
  duplicateVisualTemplateRecord,
  filterVisualTemplateRecords,
} from './records';
import type {
  VisualTemplateInput,
  VisualTemplateListFilter,
  VisualTemplateRecord,
  VisualTemplateStore,
} from './types';

export const DEFAULT_VISUAL_TEMPLATE_STORAGE_KEY = 'visual-ui-builder.templates.v1';

const readRecords = (storageKey: string): VisualTemplateRecord[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisualTemplateRecord[]) : [];
  } catch {
    return [];
  }
};

const writeRecords = (storageKey: string, records: VisualTemplateRecord[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(records));
};

export const createLocalVisualTemplateStore = (
  storageKey = DEFAULT_VISUAL_TEMPLATE_STORAGE_KEY
): VisualTemplateStore => ({
  list: async (filter?: VisualTemplateListFilter) =>
    filterVisualTemplateRecords(readRecords(storageKey), filter),
  get: async (id: string) => readRecords(storageKey).find((record) => record.id === id) || null,
  save: async (input: VisualTemplateInput) => {
    const records = readRecords(storageKey);
    const existing = input.id ? records.find((record) => record.id === input.id) : null;
    const next = createVisualTemplateRecord(input, existing);
    writeRecords(storageKey, [next, ...records.filter((record) => record.id !== next.id)]);
    return next;
  },
  delete: async (id: string) => {
    writeRecords(
      storageKey,
      readRecords(storageKey).filter((record) => record.id !== id)
    );
  },
  duplicate: async (id: string, name?: string) => {
    const records = readRecords(storageKey);
    const existing = records.find((record) => record.id === id);
    if (!existing) throw new Error(`Template ${id} was not found.`);
    const next = duplicateVisualTemplateRecord(existing, name);
    writeRecords(storageKey, [next, ...records]);
    return next;
  },
});
