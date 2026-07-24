'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLocalVisualTemplateStore } from './local-store';
import type {
  VisualTemplateInput,
  VisualTemplateListFilter,
  VisualTemplateRecord,
  VisualTemplateStore,
} from './types';

export const useVisualTemplateLibrary = ({
  store,
  filter,
}: {
  store?: VisualTemplateStore;
  filter?: VisualTemplateListFilter;
} = {}) => {
  const defaultStore = useMemo(() => createLocalVisualTemplateStore(), []);
  const actualStore = store || defaultStore;
  const [items, setItems] = useState<VisualTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await actualStore.list(filter));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load templates.'));
    } finally {
      setLoading(false);
    }
  }, [actualStore, filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: VisualTemplateInput) => {
      const saved = await actualStore.save(input);
      await refresh();
      return saved;
    },
    [actualStore, refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await actualStore.delete(id);
      await refresh();
    },
    [actualStore, refresh]
  );

  const duplicate = useCallback(
    async (id: string, name?: string) => {
      const copy = await actualStore.duplicate(id, name);
      await refresh();
      return copy;
    },
    [actualStore, refresh]
  );

  return { items, loading, error, refresh, save, remove, duplicate, store: actualStore };
};
