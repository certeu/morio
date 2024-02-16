/* eslint-disable no-undef */
export const tests = async ({ chai, expect, config }) => {
  describe(`[API] Setup tests`, () => {
    it(`Should not initiate the Morio setup if we do not send data`, (done) => {
      chai
        .request(config.api)
        .post('/settings/deploy')
        .send({})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.errors.length).to.equal(1)
          done()
        })
    })

    it(`Should not initiate the Morio setup if we send unexpected data`, (done) => {
      chai
        .request(config.api)
        .post('/settings/deploy')
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
  })
}
/* eslint-enable no-undef */
