/*
 * Import different themes we provide
 */
import { theme as light } from './light.mjs'
import { theme as dark } from './dark.mjs'

/*
 * Exporting theme as a simple object where:
 *
 * - key: theme name
 * - value: theme configuration
 */
export const themes = { light, dark }
