/*
 * PostCSS does not seem to support ESM
 */
module.exports = {
  plugins: ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer', 'postcss-for'],
}

