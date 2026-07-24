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
