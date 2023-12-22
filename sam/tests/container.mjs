export const tests = async ({ chai, expect, config, store }) => {
  describe(`[SAM] Docker container tests`, () => {
    it(`Should show inspect of a specific container`, (done) => {
      chai
        .request(config.api)
        .get(`/docker/containers/${store.container.id}`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(res.body.Id).to.equal(store.container.id)
          done()
        })
    })

    it(`Should show stats of a specific container`, (done) => {
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

    it(`Should show logs of a specific container`, (done) => {
      chai
        .request(config.api)
        .get(`/docker/containers/${store.container.id}/logs`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('text/html')
          done()
        })
    }).timeout(5000)

    for (const state of ['pause', 'unpause', 'stop', 'start', 'kill']) {
      it(`Should ${state} a specific container`, (done) => {
        chai
          .request(config.api)
          .put(`/docker/containers/${store.container.id}/${state}`)
          .end((err, res) => {
            expect(res.status).to.equal(204)
            done()
          })
      }).timeout(5000)
    }
  })
}
