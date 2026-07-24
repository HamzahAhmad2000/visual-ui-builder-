import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  createVisualTemplateRecord,
  duplicateVisualTemplateRecord,
  filterVisualTemplateRecords,
} from '../storage/records';
import type {
  VisualTemplateInput,
  VisualTemplateListFilter,
  VisualTemplateRecord,
  VisualTemplateStore,
} from '../storage/types';

export interface FileVisualTemplateStoreOptions {
  filePath?: string;
}

const defaultFilePath = () => join(process.cwd(), '.visual-ui-builder', 'templates.json');

const readRecords = async (filePath: string): Promise<VisualTemplateRecord[]> => {
  try {
    const raw = await readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as VisualTemplateRecord[]) : [];
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return [];
    throw error;
  }
};

const writeRecords = async (filePath: string, records: VisualTemplateRecord[]) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');
};

export const createFileVisualTemplateStore = (
  options: FileVisualTemplateStoreOptions = {}
): VisualTemplateStore => {
  const filePath = options.filePath || defaultFilePath();
  return {
    list: async (filter?: VisualTemplateListFilter) =>
      filterVisualTemplateRecords(await readRecords(filePath), filter),
    get: async (id: string) => (await readRecords(filePath)).find((record) => record.id === id) || null,
    save: async (input: VisualTemplateInput) => {
      const records = await readRecords(filePath);
      const existing = input.id ? records.find((record) => record.id === input.id) : null;
      const next = createVisualTemplateRecord(input, existing);
      await writeRecords(filePath, [next, ...records.filter((record) => record.id !== next.id)]);
      return next;
    },
    delete: async (id: string) => {
      await writeRecords(
        filePath,
        (await readRecords(filePath)).filter((record) => record.id !== id)
      );
    },
    duplicate: async (id: string, name?: string) => {
      const records = await readRecords(filePath);
      const existing = records.find((record) => record.id === id);
      if (!existing) throw new Error(`Template ${id} was not found.`);
      const next = duplicateVisualTemplateRecord(existing, name);
      await writeRecords(filePath, [next, ...records]);
      return next;
    },
  };
};
