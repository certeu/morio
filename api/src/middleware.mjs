import jwt from 'passport-jwt'
import { generateJwtKey } from '#shared/crypto'
import { getPreset } from '#config'

/*
 * There is (currently) no Express middleware in use.
 * However, we have this here to take the guesswork out of adding it later.
 */
export const loadExpressMiddleware = () => {}

/*
 * We load the JWT middleware for passport (authentication)
 */
export const loadPassportMiddleware = (passport, tools) => {
  /*
   * When there is no config (yet) generate a bogus JWT config as not having any will cause errors
   */
  const jwtConfig = tools.config?.jwt
    ? tools.config.jwt
    : {
        secretOrKey: generateJwtKey(),
        issuer: 'https://mor.io/',
        expiresIn: getPreset('MORIO_API_JWT_EXPIRY', '7d'),
      }
  if (tools.config?.jwt) {
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
