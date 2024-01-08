export const tests = async ({ chai, expect, config, store }) => {
  describe(`[API] Docker tests`, () => {
    it(`Should return Docker info`, (done) => {
      chai
        .request(config.api)
        .get('/docker/info')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.ID).to.equal('string')
          done()
        })
    })

    it(`Should return Docker version`, (done) => {
      chai
        .request(config.api)
        .get('/docker/version')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.Version).to.equal('string')
          done()
        })
    })

    it(`Should return Docker df`, (done) => {
      chai
        .request(config.api)
        .get('/docker/df')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.LayersSize).to.equal('number')
          done()
        })
    })

    it(`Should return running Docker containers`, (done) => {
      chai
        .request(config.api)
        .get('/docker/containers')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })

    it(`Should return all Docker containers`, (done) => {
      chai
        .request(config.api)
        .get('/docker/all-containers')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          store.container = res.body[0]
          done()
        })
    })

    it(`Should return all Docker images`, (done) => {
      chai
        .request(config.api)
        .get('/docker/images')
        .end((err, res) => {
          console.log(JSON.stringify(res.body, null, 2))
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          store.image = res.body[0]
          done()
        })
    })
  })
}
