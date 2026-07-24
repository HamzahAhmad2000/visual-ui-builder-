import { defineConfig } from 'tsup';

const external = [
  '@dnd-kit/core',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  '@radix-ui/react-label',
  '@radix-ui/react-popover',
  '@radix-ui/react-select',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  'class-variance-authority',
  'clsx',
  'lucide-react',
  'react',
  'react-dom',
  'tailwind-merge',
  'uuid',
];

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ui/index': 'src/ui/index.ts',
    'theme/index': 'src/theme/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: false,
  external,
});
