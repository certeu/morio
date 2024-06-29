import qrcode from 'qrcode'
import { authenticator } from '@otplib/preset-default'
import { hash } from '#shared/crypto'
import { store } from './utils.mjs'

/*
 * Colors to replace in the generated SVG so that the SVG
 * works in both light and dark theme
 */
const dark = '#AAAAAA'
const light = '#EEEEEE'

/*
 * Where mfa.enroll is needed, mfa.verify is too,
 * so let's just export a single object
 */
export const mfa = {
  /**
   * Enrolls an account in MFA
   *
   * @param {string} username - The username
   */
  enroll: async (username) => {
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(
      username,
      `Morio/${store.config.deployment.display_name}`,
      secret
    )
    let svg
    try {
      svg = await qrcode.toString(otpauth, {
        type: 'svg',
        color: { dark, light },
      })
    } catch (err) {
      console.log(err)
    }
    svg = svg
      .replace(dark, 'currentColor')
      .replace(light, 'none')
      .replace('<svg ', '<svg class="qrcode" width="100%" height="100%" ')

    return { secret, otpauth, qrcode: svg }
  },
  verify: async (token, secret, hashedScratchCodes) => {
    let result = authenticator.check(token, secret)
    /*
     *  If it's good, return early
     */
    if (result) return hashedScratchCodes ? [true, hashedScratchCodes] : true

    /*
     *  If it fails, it could be a scratch code if we have any
     */
    if (hashedScratchCodes && Array.isArray(hashedScratchCodes) && hashedScratchCodes.length > 0) {
      const hashed = await hash(`${token}`) // Force to string
      if (hashedScratchCodes.includes(hashed))
        return [true, hashedScratchCodes.filter((val) => val !== hashed)]
    }

    return false
  },
}
