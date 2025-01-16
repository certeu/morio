/*
 * The RSS input is so simple, we can use the base input as-is
 * So we import it and then just re-export it under the right name
 */
import { baseInput as rssInput, baseOutput as rssOutput } from './lib.mjs'

export { rssInput, rssOutput }
