import { defineConfig } from 'vite';
import { resolve } from 'path';

const commands = ['cli', 'add', 'list', 'find', 'rename', 'remove', 'sync-env'];

export default defineConfig({
  build: {
    lib: {
      entry: commands.reduce((entries, cmd) => {
        entries[cmd] = resolve(__dirname, `src/${cmd}.ts`);
        return entries;
      }, {} as Record<string, string>),
      formats: ['es'],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'child_process',
        'fs',
        'path',
        'os',
        'url',
      ],
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    target: 'node18',
  },
  plugins: [
    {
      name: 'add-shebang',
      generateBundle(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            chunk.code = '#!/usr/bin/env node\n' + chunk.code;
          }
        }
      },
    },
  ],
});
