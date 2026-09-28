// @ts-check
import { defineConfig } from 'astro/config';
import { stripTodos } from './src/lib/remark-strip-todos.mjs';

// GitHub Pages user-site URL from the aaranp.github.io repository.
export default defineConfig({
  site: 'https://aaranp.github.io',
  markdown: {
    remarkPlugins: [stripTodos],
  },
  vite: {
    server: {
      fs: {
        // data folders (projects/, experience/, profile/, assets/) live one
        // level above this Astro project
        allow: ['..'],
      },
    },
  },
});
