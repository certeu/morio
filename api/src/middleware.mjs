import jwt from 'passport-jwt'
import { generateJwtKey } from '#shared/crypto'
import { getPreset } from '#config'
import { store } from './lib/store.mjs'

/*
 * There is (currently) no Express middleware in use.
 * However, we have this here to take the guesswork out of adding it later.
 */
export const loadExpressMiddleware = () => {}

/*
 * We load the JWT middleware for passport (authentication)
 */
export const loadPassportMiddleware = (passport) => {
  /*
   * When there is no config (yet) generate a bogus JWT config as not having any will cause errors
   */
  const jwtConfig = store.config?.jwt
    ? store.config.jwt
    : {
        secretOrKey: generateJwtKey(),
        issuer: 'https://mor.io/',
        expiresIn: getPreset('MORIO_API_JWT_EXPIRY', '7d'),
      }
  if (store.config?.jwt) {
    passport.use(
      'jwt',
      new jwt.Strategy(
        {
          jwtFromRequest: jwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
          ...jwtConfig,
        },
        (jwt_payload, done) => done(null, jwt_payload)
      )
    )
  }
}
