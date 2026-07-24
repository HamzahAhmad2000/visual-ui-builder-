import type {
  VisualTemplateInput,
  VisualTemplateListFilter,
  VisualTemplateRecord,
  VisualTemplateStore,
} from './types';

const toQueryString = (filter?: VisualTemplateListFilter) => {
  const params = new URLSearchParams();
  if (filter?.scope && filter.scope !== 'all') params.set('scope', filter.scope);
  if (filter?.kind && filter.kind !== 'all') params.set('kind', filter.kind);
  if (filter?.status && filter.status !== 'all') params.set('status', filter.status);
  if (filter?.query) params.set('query', filter.query);
  const query = params.toString();
  return query ? `?${query}` : '';
};

const parseResponse = async <T,>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const createRemoteVisualTemplateStore = (
  baseUrl = '/api/visual-ui-builder/templates'
): VisualTemplateStore => ({
  list: async (filter?: VisualTemplateListFilter) =>
    parseResponse<VisualTemplateRecord[]>(await fetch(`${baseUrl}${toQueryString(filter)}`)),
  get: async (id: string) =>
    parseResponse<VisualTemplateRecord | null>(await fetch(`${baseUrl}/${encodeURIComponent(id)}`)),
  save: async (input: VisualTemplateInput) => {
    const hasId = Boolean(input.id);
    return parseResponse<VisualTemplateRecord>(
      await fetch(hasId ? `${baseUrl}/${encodeURIComponent(input.id!)}` : baseUrl, {
        method: hasId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    );
  },
  delete: async (id: string) => {
    await parseResponse<{ ok: true }>(
      await fetch(`${baseUrl}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    );
  },
  duplicate: async (id: string, name?: string) =>
    parseResponse<VisualTemplateRecord>(
      await fetch(`${baseUrl}/${encodeURIComponent(id)}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
    ),
});
