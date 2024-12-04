/*
 * The Sink out input is so simple, we can use the base input as-is
 * So we import it and then just re-export it under the right name
 */
import { baseOutput as sinkOutput } from './lib.mjs'

export { sinkOutput }
