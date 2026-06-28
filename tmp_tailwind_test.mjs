import { compile } from "@tailwindcss/node";
const css = `@import "tailwindcss";
@layer utilities {
  .test { @apply dark:bg-black; }
}`;
compile(css, {
  from: 'test.css',
  base: process.cwd(),
  config: {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  },
}).then(res => {
  console.log('LEN', res.code.length);
  console.log('HAS_PREFERS', /@media\(prefers-color-scheme: dark\)/.test(res.code));
  console.log('HAS_DARK_CLASS', /\.dark\\:bg-black/.test(res.code));
  console.log(res.code.slice(0, 400));
}).catch(err => {
  console.error(err);
  process.exit(1);
});
