/*
 * This file holds settings that cannot be changed by an admin
 */
export const settings = {
  /*
   * Min and max amount of MORIO nodes
   */
  nodes: {
    min: 1,
    max: 99,
  },
  /*
   * Min and max length of passphrase (in bytes)
   */
  passphrase: {
    min: 8,
    max: 64,
    dflt: 16,
  },
  key_pair: {
    length: 4096,
    alg: 'rsa',
    public: {
      type: 'spki',
      format: 'pem',
    },
    private: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
    }
  }
}

