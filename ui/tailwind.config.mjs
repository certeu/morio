/*
 * The configuration file for Tailwind CSS framework
 * See: https://tailwindcss.com/
 */

/*
 * We use the DaisyUI component library
 */
import daisyui from 'daisyui'

const tailwindConfig = {
  content: [
    './pages/**/*.{mjs,js}',
    './components/**/*.{mjs}',
  ],
  plugins: [
    daisyui,
  ],
  daisyui: {
    themes: ["light", "dark"],
  },
}

export default tailwindConfig
