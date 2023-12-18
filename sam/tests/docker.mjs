export const tests = async ({ chai, expect, config, store }) => {
  describe(`[SAM] Docker tests`, () => {
    it(`Should load the status endpoint`, (done) => {
      chai
        .request(config.api)
        .get('/status')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.name).to.equal('string')
          expect(typeof res.body.about).to.equal('string')
          expect(typeof res.body.version).to.equal('string')
          expect(typeof res.body.uptime).to.equal('string')
          expect(typeof res.body.uptime_seconds).to.equal('number')
          expect(typeof res.body.setup).to.equal('boolean')
          done()
        })
    })
  })
}
