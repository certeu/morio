/*
 * This file is auto-generated every time the morio-tap container starts.
 * It will be overwritten at the next restart.
 *
 * A tap handler is a handler for Morio's Tap service that allows
 * you to 'tap into' the streaming data without having to write code
 * to handle streaming data.
 *
 * Tap handlers can dynamically be extended, and load code that is
 * (for example) preseeded from a git repository.
 * This is handled by the containers entrypoint script which will
 * auto-generate files like this one.
 */
import morio_tap from './morio-tap.mjs'

export default {
  "morio-tap": morio_tap
}
