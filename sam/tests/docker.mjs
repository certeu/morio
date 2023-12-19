import containerCreateBody from './bodies/container-create.json' assert { type: 'json' }

export const tests = async ({ chai, expect, config, store }) => {
  /*
  describe(`[SAM] Docker POST tests`, () => {
    it(`Should pull a docker image`, (done) => {
      chai
        .request(config.api)
        .post('/docker/pull')
        .send({ tag: 'debian:12-slim' })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/x-ndjson')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    }).timeout(5000)
  })
  */

  describe(`[SAM] Docker GET tests`, () => {
    it(`Should show docker info`, (done) => {
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

    it(`Should show docker version`, (done) => {
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

    it(`Should show docker df`, (done) => {
      chai
        .request(config.api)
        .get('/docker/df')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body.Images)).to.equal(true)
          done()
        })
    })

    it(`Should list containers (containers)`, (done) => {
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

    it(`Should list running containers (running-containers)`, (done) => {
      chai
        .request(config.api)
        .get('/docker/running-containers')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })

    it(`Should list all containers (all-containers)`, (done) => {
      chai
        .request(config.api)
        .get('/docker/all-containers')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })

    it(`Should list images`, (done) => {
      chai
        .request(config.api)
        .get('/docker/images')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })

    it(`Should list services`, (done) => {
      chai
        .request(config.api)
        .get('/docker/services')
        .end((err, res) => {
          if (res.status === 500)
            expect(res.body.error.indexOf('not a swarm manager') !== -1).to.equal(true)
          else {
            expect(res.status).to.equal(200)
            expect(Array.isArray(res.body)).to.equal(true)
          }
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    })

    it(`Should list nodes`, (done) => {
      chai
        .request(config.api)
        .get('/docker/nodes')
        .end((err, res) => {
          if (res.status === 500)
            expect(res.body.error.indexOf('not a swarm manager') !== -1).to.equal(true)
          else {
            expect(res.status).to.equal(200)
            expect(Array.isArray(res.body)).to.equal(true)
          }
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    })

    it(`Should list tasks`, (done) => {
      chai
        .request(config.api)
        .get('/docker/tasks')
        .end((err, res) => {
          if (res.status === 500)
            expect(res.body.error.indexOf('not a swarm manager') !== -1).to.equal(true)
          else {
            expect(res.status).to.equal(200)
            expect(Array.isArray(res.body)).to.equal(true)
          }
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    })

    it(`Should list secrets`, (done) => {
      chai
        .request(config.api)
        .get('/docker/secrets')
        .end((err, res) => {
          if (res.status === 500)
            expect(res.body.error.indexOf('not a swarm manager') !== -1).to.equal(true)
          else {
            expect(res.status).to.equal(200)
            expect(Array.isArray(res.body)).to.equal(true)
          }
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    })

    it(`Should list configs`, (done) => {
      chai
        .request(config.api)
        .get('/docker/configs')
        .end((err, res) => {
          if (res.status === 500)
            expect(res.body.error.indexOf('not a swarm manager') !== -1).to.equal(true)
          else {
            expect(res.status).to.equal(200)
            expect(Array.isArray(res.body)).to.equal(true)
          }
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          done()
        })
    })

    it(`Should list plugins`, (done) => {
      chai
        .request(config.api)
        .get('/docker/plugins')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })

    it(`Should list volumes`, (done) => {
      chai
        .request(config.api)
        .get('/docker/volumes')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body.Volumes)).to.equal(true)
          done()
        })
    })

    it(`Should list networks`, (done) => {
      chai
        .request(config.api)
        .get('/docker/networks')
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
    })
  })
}
