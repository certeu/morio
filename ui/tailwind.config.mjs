/*
 * The configuration file for Tailwind CSS framework
 * See: https://tailwindcss.com/
 */
import { themes } from './themes/index.mjs'

/*
 * We use the DaisyUI component library
 */
import daisyui from 'daisyui'

const tailwindConfig = {
  content: [
    './pages/**.mjs',
    './pages/**/*.mjs',
    './components/**.mjs',
    './components/**/*.mjs',
    './tailwind-force.html',
  ],
  daisyui: {
    styled: true,
    themes: [themes],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
  plugins: [
    daisyui,
  ],
}

export default tailwindConfig
