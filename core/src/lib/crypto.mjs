import { hashPassword, randomString } from '#shared/crypto'

/*
 * This generated a Morio key seam
 *
 * @return {object} seal - A key seal (object, with salt and hash attributes)
 */
export const generateKeySeal = async () => await hashPassword(randomString(64))

/*
 * This generated a Morio Root Token
 *
 * @return {string} mrt - The Morio Root Token
 */
export const generateRootToken = async () => 'mrt.' + (await randomString(32))

/*
 * A description to go with the generated Root Token
 */
export const formatRootTokenResponseData = (mrt) => ({
  about: `This is the Morio Root Token.
You can use it to authenticate before any authentication providers have been
set up. Store it in a safe space, as it will never be shown again.`,
  value: mrt,
})
