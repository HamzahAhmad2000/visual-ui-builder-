import { createFileVisualTemplateStore } from './file-store';
import type { ContentComposerCase } from '../profiles/profiles';
import type {
  VisualTemplateInput,
  VisualTemplateKind,
  VisualTemplateListFilter,
  VisualTemplateStatus,
  VisualTemplateStore,
} from '../storage/types';

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    headers: { 'Cache-Control': 'no-store', ...init?.headers },
    ...init,
  });

const errorJson = (message: string, status = 400) => json({ error: message }, { status });

const filterFromRequest = (request: Request): VisualTemplateListFilter => {
  const params = new URL(request.url).searchParams;
  return {
    scope: (params.get('scope') as ContentComposerCase | null) || undefined,
    kind: (params.get('kind') as VisualTemplateKind | null) || undefined,
    status: (params.get('status') as VisualTemplateStatus | null) || undefined,
    query: params.get('query') || undefined,
  };
};

const getParamId = async (context?: { params?: { id?: string } | Promise<{ id?: string }> }) => {
  const params = await context?.params;
  return params?.id;
};

export const createVisualTemplateCollectionHandlers = (
  store: VisualTemplateStore = createFileVisualTemplateStore()
) => ({
  GET: async (request: Request) => json(await store.list(filterFromRequest(request))),
  POST: async (request: Request) => {
    const input = (await request.json()) as VisualTemplateInput;
    return json(await store.save(input), { status: 201 });
  },
});

export const createVisualTemplateItemHandlers = (
  store: VisualTemplateStore = createFileVisualTemplateStore()
) => ({
  GET: async (_request: Request, context?: { params?: { id?: string } | Promise<{ id?: string }> }) => {
    const id = await getParamId(context);
    if (!id) return errorJson('Missing template id.', 400);
    const item = await store.get(id);
    return item ? json(item) : errorJson('Template not found.', 404);
  },
  PUT: async (request: Request, context?: { params?: { id?: string } | Promise<{ id?: string }> }) => {
    const id = await getParamId(context);
    if (!id) return errorJson('Missing template id.', 400);
    const input = (await request.json()) as VisualTemplateInput;
    return json(await store.save({ ...input, id }));
  },
  DELETE: async (_request: Request, context?: { params?: { id?: string } | Promise<{ id?: string }> }) => {
    const id = await getParamId(context);
    if (!id) return errorJson('Missing template id.', 400);
    await store.delete(id);
    return json({ ok: true });
  },
});

export const createVisualTemplateDuplicateHandler = (
  store: VisualTemplateStore = createFileVisualTemplateStore()
) => ({
  POST: async (request: Request, context?: { params?: { id?: string } | Promise<{ id?: string }> }) => {
    const id = await getParamId(context);
    if (!id) return errorJson('Missing template id.', 400);
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    return json(await store.duplicate(id, body.name), { status: 201 });
  },
});
