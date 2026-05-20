import type { Config } from 'tailwindcss';

// Tailwind сканирует src/ — там все компоненты и страницы.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
