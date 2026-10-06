import { defineConfig, envField } from 'astro/config';

const SITE_ENV = process.env.SITE_ENV ?? 'staging';
const production = SITE_ENV === 'production';

export default defineConfig({
  site: production ? 'https://www.achates360.com' : 'https://mingkey88.github.io',
  base: production ? '/' : '/achates360-website',
  trailingSlash: 'never',
  build: { format: 'file' },
  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server', access: 'public',
        values: ['staging', 'production'], default: 'staging',
      }),
      PUBLIC_FORM_ENDPOINT: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
