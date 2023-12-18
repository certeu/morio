export const tests = async ({ chai, expect, config, store }) => {
  describe(`[SAM] Setup tests`, () => {
    it(`Should not initiate the MORIO setup if we do not send data`, (done) => {
      chai
        .request(config.api)
        .post('/setup/morio')
        .send({})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should not initiate the MORIO setup if we send unexpected data`, (done) => {
      chai
        .request(config.api)
        .post('/setup/morio')
        .send({
          hello: 'morio',
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should initiate the MORIO setup`, (done) => {
      chai
        .request(config.api)
        .post('/setup/morio')
        .send({
          nodes: ['morio.cert.europa.eu'],
        })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.setup_token).to.equal('string')

          store.setup_token = res.body.setup_token

          done()
        })
    })

    it(`Should generate a random JWT key`, (done) => {
      chai
        .request(config.api)
        .post('/setup/jwtkey')
        .send({ setup_token: store.setup_token })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.jwt_key).to.equal('string')
          done()
        })
    })

    it(`Should not generate a random JWT key without a setup_token`, (done) => {
      chai
        .request(config.api)
        .post('/setup/jwtkey')
        .send({})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should generate a random password`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({ setup_token: store.setup_token })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.password).to.equal('string')
          expect(res.body.password.length).to.equal(32)

          store.passphrase = res.body.password

          done()
        })
    })

    it(`Should not generate a too short password`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({
          setup_token: store.setup_token,
          bytes: 7,
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should not generate a too long password`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({
          setup_token: store.setup_token,
          bytes: 65,
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should generate a long password`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({
          setup_token: store.setup_token,
          bytes: 64,
        })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.password.length).to.equal(128)
          done()
        })
    })

    it(`Should generate a short password`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({
          setup_token: store.setup_token,
          bytes: 8,
        })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.password.length).to.equal(16)
          done()
        })
    })

    it(`Should not generate a random password without a setup_token`, (done) => {
      chai
        .request(config.api)
        .post('/setup/password')
        .send({})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should generate a random key pair`, (done) => {
      chai
        .request(config.api)
        .post('/setup/keypair')
        .send({
          setup_token: store.setup_token,
          passphrase: store.passphrase,
        })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.key_pair.public).to.equal('string')
          expect(typeof res.body.key_pair.private).to.equal('string')
          done()
        })
    })

    it(`Should not generate a random key pair without passphrase`, (done) => {
      chai
        .request(config.api)
        .post('/setup/keypair')
        .send({
          setup_token: store.setup_token,
        })
        .end((err, res) => {
          //console.log(JSON.stringify(res.body, null, 2))
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })
  })
}
