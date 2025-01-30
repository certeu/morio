// Handle themes
import { light, dark } from './themes/index.mjs'
import daisyui from 'daisyui'
import prose from '@tailwindcss/typography'

export default {
  content: [
    './src/pages/hub/*.js',
    './src/pages/hub/**/*.js',
    './src/components/moriohub/*.js',
    './tailwind-force.html',
  ],
  plugins: [daisyui, prose],
  darkMode: ['class', "[data-theme='dark']"],
  //prefix: 'tw-',
  daisyui: {
    themes: [{ light, dark }],
    logs: true,
    themeRoot: '*',
    //prefix: 'daisy-',
  },
  theme: {
    extend: {
      aspectRatio: {
        '9/16': '9 / 16',
      },
    },
  },
}
