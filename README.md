# Visual UI Builder

Standalone, plug-and-play visual content builder package.

It is intentionally self-contained: all builder components, local UI primitives,
theme variables, theme scopes, and basic color settings live in this folder.

```tsx
import {
  ContentBuilderModal,
  VisualUiBuilderThemeProvider,
  BasicThemeEditor,
  getContentComposerProfile,
} from '@project/visual-ui-builder';
import '@project/visual-ui-builder/styles.css';
```

Covered package surfaces:

- Email templates
- Surveys
- Documentation rich blocks
- Announcements
- Pop-up news

Theme scopes:

- `builder`
- `email`
- `survey`
- `docs`
- `announcement`
- `popup-news`

The package exports the production-grade block model, renderer, parser,
serializer, palette, canvas, settings panel, profiles, survey helpers, and
legacy email-template adapter.

Shared UI components are exported from `@project/visual-ui-builder/ui`. They are
shadcn-style wrappers backed by Radix primitives, CVA variants, and the package
theme tokens: `Button`, `Input`, `Textarea`, `Label`, `Switch`, `Select`,
`Popover`, `Card`, `Badge`, `Separator`, `ColorPicker`, and `RichTextEditor`.

Template storage is included. For client-only persistence, render
`<VisualTemplateManager />`; it uses `localStorage` by default and lets users
create, edit, duplicate, delete, and reopen saved templates/components.

For Next.js filesystem persistence, add route handlers in the host app:

```ts
// app/api/visual-ui-builder/templates/route.ts
import { createVisualTemplateCollectionHandlers } from '@project/visual-ui-builder/next';

export const { GET, POST } = createVisualTemplateCollectionHandlers();
```

```ts
// app/api/visual-ui-builder/templates/[id]/route.ts
import { createVisualTemplateItemHandlers } from '@project/visual-ui-builder/next';

export const { GET, PUT, DELETE } = createVisualTemplateItemHandlers();
```

```ts
// app/api/visual-ui-builder/templates/[id]/duplicate/route.ts
import { createVisualTemplateDuplicateHandler } from '@project/visual-ui-builder/next';

export const { POST } = createVisualTemplateDuplicateHandler();
```

Then use the remote store in a client component:

```tsx
import {
  VisualTemplateManager,
  createRemoteVisualTemplateStore,
} from '@project/visual-ui-builder/storage';

const store = createRemoteVisualTemplateStore();

export function TemplateLibrary() {
  return <VisualTemplateManager store={store} />;
}
```
