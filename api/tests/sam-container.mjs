export const tests = async ({ chai, expect, config, store }) => {
  describe(`[API] Container tests`, () => {
    it(`Should return inspect of a specific Docker container`, (done) => {
      chai
        .request(config.api)
        .get(`/docker/containers/${store.container.id}`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    }).timeout(5000)

    it(`Should return logs from a specific Docker container`, (done) => {
      chai
        .request(config.api)
        .get(`/docker/containers/${store.container.id}/logs`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    }).timeout(5000)

    it(`Should return stats from a specific Docker container`, (done) => {
      chai
        .request(config.api)
        .get(`/docker/containers/${store.container.id}/stats`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.id).to.equal(store.container.id)
          done()
        })
    }).timeout(5000)
  })
}
