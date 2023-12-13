import j2s from 'joi-to-swagger'
import { requestSchema, responseSchema, errorsSchema } from '../src/schema.mjs'
import { fromEnv } from '../src/lib/env.mjs'

const shared = {
  tags: [ 'Setup' ]
}

const request = (description, key, examples=false, example=false) => {
  const data = {
    requestBody: {
      description,
      content: {
        'application/json': {
          schema: j2s(requestSchema.setup[key]).swagger,
        }
      }
    }
  }
  if (examples) data.requestBody.content['application/json'].examples = examples
  else if (example) data.requestBody.content['application/json'].example = example

  return data
}

const response = (description, schema, example={}) => ({
  description,
  content: {
    'application/json': {
      schema: j2s(schema).swagger,
      example,
    }
  }
})

const setup_token = "mst.735bf58352dfb40d9ecfb829af230a1274a4a8f1583b93a3a0c1d58ed767682a"

export const paths = {
  '/setup/morio': {
    post: {
      ...shared,
      summary: `Starts the initial setup of a MORIO instance or cluster`,
      description: `Starts the process of setting up a MORIO instance or cluster.
        <br>
        Can only be accessed when MORIO has not yet been setup.
        <br>
        The <code>setup_token</code> that is returned is required to access the other setup endpoints.
        <br/>
        Only restarting the API will change the <code>setup_token</code>.
      `,
      ...request(
        'Post an array of hostnames to setup MORIO.<br>A single hostname for a stand-alone instance, or an odd number of nodes for a cluster setup',
        'morio',
        {
          'MORIO Stand-alone Instance': {
            value: { nodes: ['morio.cert.europa.eu'] }
          },
          'MORIO Cluster': {
            value: {
              nodes: [
                'morio-cluster-node1.cert.europa.eu',
                'morio-cluster-node2.cert.europa.eu',
                'morio-cluster-node3.cert.europa.eu',
                'morio-cluster-node4.cert.europa.eu',
                'morio-cluster-node5.cert.europa.eu',
              ]
            }
          }
        }),
      responses: {
        200: response(
          'Setup initiated successfully',
          responseSchema.setup.morio,
          { setup_token }
        ),
        400: response(
          'Data validation error',
          errorsSchema,
          { errors: [ `"nodes" is required` ] }
        ),
        401: response(
          'Setup is not currently possible',
          errorsSchema,
          { errors: [ "The current MORIO state does not allow initiating setup" ] }
        ),
      }
    }
  },
  '/setup/jwtkey': {
    post: {
      ...shared,
      summary: `Generates a random key to sign JWTs`,
      description: `This generates a random (and ephemeral) key that can be used to sign JSON Web Tokens (JWT).
        <br> It is used by the setup process, but if needed, you can also use this endpoint if you provide a valid <code>setup_token</code>.`,
      ...request(
        'Post the <code>setup_token</code> to unlock this endpoint.',
        'jwtkey',
        false,
        { setup_token }
      ),
      responses: {
        200: response(
          'JWT key generated successfully',
          responseSchema.setup.jwtkey,
          { jwt_key: "b57782b663300315c47c687ea898638f87512216c5efc92c94c2562984a040b3d8d221711e7816b6825a1197e3cbadaa95bc1b65c09dbed8d5d07536ed799012" }
        ),
        400: response(
          'Data validation error',
          errorsSchema,
          { errors: [ `"setup_token" is required` ] }
        ),
        401: response(
          'Setup is not currently possible',
          errorsSchema,
          { errors: [ "The current MORIO state does not allow initiating setup" ] }
        ),
      }
    }
  },
  '/setup/password': {
    post: {
      ...shared,
      summary: `Generates a random password`,
      description: `This generates a random (and ephemeral) password.
        <br>
        It is used by the setup process, but if needed, you can also use this endpoint if you provide a valid <code>setup_token</code>.`,
      ...request(`Post <code>bytes</code> to control the length (in bytes, where 1 byte = 2 characters)
        <br>
        Post the <code>setup_token</code> to unlock this endpoint.
        `,
        'password',
        {
          'Default length': {
            value: { setup_token }
          },
          'Custom length': {
            value: { setup_token, bytes: 64 }
          }
        }
      ),
      responses: {
        200: response(
          'Password generated successfully',
          responseSchema.setup.jwtkey,
          { password: "e9c4c68a14dcae192679d91900d6ae60" }
        ),
        400: response(
          'Data validation error',
          errorsSchema,
          { errors: [ `"setup_token" is required` ] }
        ),
        401: response(
          'Setup is not currently possible',
          errorsSchema,
          { errors: [ "The current MORIO state does not allow initiating setup" ] }
        ),
      }
    }
  },
  '/setup/keypair': {
    post: {
      ...shared,
      summary: `Generates a random key pair`,
      description: `<p>
          This generates a random (and ephemeral) key pair.
          <br>
          The <code>passphrase</code> you provide will be used to encrypt the private key
          <br>
          It is used by the setup process, but if needed, you can also use this endpoint if you provide a valid <code>setup_token</code>.
        </p>
        <p>The generated key pair will have the following properties:</p>
        <ul>
          <li>Length: <b>${fromEnv('MORIO_CRYPTO_KEY_LEN')}</b></li>
          <li>Algorithm: <b>${fromEnv('MORIO_CRYPTO_KEY_ALG').toUpperCase()}</b></li>
          <li>Public key:
            <ul>
              <li>Type: <b>${fromEnv('MORIO_CRYPTO_PUB_KEY_TYPE').toUpperCase()}</b></li>
              <li>Format: <b>${fromEnv('MORIO_CRYPTO_PUB_KEY_FORMAT').toUpperCase()}</b></li>
            </ul>
          </li>
          <li>Private key:
            <ul>
              <li>Type: <b>${fromEnv('MORIO_CRYPTO_PRIV_KEY_TYPE').toUpperCase()}</b></li>
              <li>Format: <b>${fromEnv('MORIO_CRYPTO_PRIV_KEY_FORMAT').toUpperCase()}</b></li>
              <li>Format: <b>${fromEnv('MORIO_CRYPTO_PRIV_KEY_CIPHER').toUpperCase()}</b></li>
            </ul>
          </li>
        </ul>
      `,
      ...request(`Post <code>passphrase</code> to encrypt the private key.
        <br>
        Post the <code>setup_token</code> to unlock this endpoint.
        `,
        'keypair',
        false,
        {
          setup_token,
          passphrase: "e9c4c68a14dcae192679d91900d6ae60"
        }
     ),
      responses: {
        200: response(
          'Password generated successfully',
          responseSchema.setup.keypair,
          {
            key_pair: {
              public: `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAkCO0ZenvTD8KyrlZlBPD
W4dV8Av3hB1Gyn5XcyI14KGGbAHlvMq8yY50fanA8gxCTkPbzRL5FKAHwOrs++bR
65VMi9JE1C2X/HL2jwC8hCmeAz5LYFm9bs650UKfwAbRXML0HMrohbEeC3YKNo4/
JNZCAxGSZGxHpyfzHwpZcTr2o6XycdDzx5/BiHC2SRFsQ6ewZch9gRwc0T/E7kSZ
YyQgHyIffyqbSgSZQV+KoCEBedmkkQzaWSrV3DhfJbPe3sQhr8b3mjIcIbtYxwq1
kE92f0VY8MGycl+hPCAEfldgpHAAZVQiSc++ZFFUvbfWsH8KnbFCs69m00+s2yhJ
+uJpjeRY3SqDXR69eNBgvQsLlqovmP4zKFuCpi/O6X52bLXuutIwToxOHgmGXYG3
+/GjcNZnLlzqg5U5JwvWRUR5YGCE1Uww646dLh3aUbCmBHDqicyeHGsExc7giC6n
9/rQb4F5fKalSRO4yrDdz/X9VuJIJULq8nHQLRgwmEz+hVvI8SuQDubD+MOADvNn
xHvQEvYuJJ4YTQFdxkxV5DIfuE4+PYW3+YxlulRtagJYzWzO9YbD5XUZFmXwdRvk
wKGte6ce363BTubSQoAfGPxZkVjrYrMXnae78w303AUwwFO71V809oAsjcJQDhDa
VysV/OY7Ehr5u/2XbpmzzEcCAwEAAQ==
-----END PUBLIC KEY-----`,
              private: `
-----BEGIN ENCRYPTED PRIVATE KEY-----
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
-----END ENCRYPTED PRIVATE KEY-----`,
            }
          }
        ),
        400: response(
          'Data validation error',
          errorsSchema,
          { errors: [ `"setup_token" is required` ] }
        ),
        401: response(
          'Setup is not currently possible',
          errorsSchema,
          { errors: [ "The current MORIO state does not allow initiating setup" ] }
        ),
      }
    }
  },
}

