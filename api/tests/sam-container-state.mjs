export const tests = async ({ chai, expect, config, store }) => {
  describe(`[API] Container state tests`, () => {
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
