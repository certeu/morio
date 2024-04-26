import { core, getPreset, store, equalIgnoreSpaces } from './utils.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

describe('Core Package Tests', () => {
  /*
   * GET /pkgs/clients/deb/defaults
   *
   * Example response:
   * {
   *   Package: 'morio-client',
   *   Source: 'morio-client',
   *   Section: 'utils',
   *   Priority: 'optional',
   *   Architecture: 'amd64',
   *   Essential: 'no',
   *   Depends: [
   *     [ 'auditbeat', '>= 8.12' ],
   *     [ 'filebeat', '>= 8.12' ],
   *     [ 'metricbeat', '>= 8.12' ]
   *   ],
   *   'Installed-Size': 5000,
   *   Maintainer: 'CERT-EU <services@cert.europa.eu>',
   *   'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
   *   Uploaders: [ 'Joost De Cock <joost.decock@cert.europa.eu>' ],
   *   Homepage: 'https://github.com/certeu/morio',
   *   Description: 'The Morio client collects and ships observability data to a Morio instance.',
   *   DetailedDescription: 'Deploy this Morio client (based on Elastic Beats) on your endpoints,\n' +
   *     'and collect their data on one or more centralized Morio instances\n' +
   *     'for analysis, further processing, downstream routing & filtering,\n' +
   *     'or event-driven automation.',
   *   'Vcs-Git': 'https://github.com/certeu/morio -b main [clients/linux]',
   *   Version: '0.1.6',
   *   Revision: 1
   * }
   */
  it(`Should GET /pkgs/clients/deb/defaults`, async () => {
    const result = await core.get(`/pkgs/clients/deb/defaults`)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 200)
    assert.equal(typeof d, 'object')
    assert.equal(d.Package, 'morio-client')
    assert.equal(d.Source, 'morio-client')
    assert.equal(d.Section, 'utils')
    assert.equal(d.Priority, 'optional')
    assert.equal(d.Architecture, 'amd64')
    assert.equal(d.Essential, 'no')
    assert.equal(Array.isArray(d.Depends), true)
    assert.equal(d.Depends.length, 3)
    assert.equal(d.Version, getPreset('MORIO_VERSION'))

    store.pkg_deb_defaults = d
  })

  /*
   * POST /pkgs/clients/deb/defaults
   *
   * Example response:
   * {
   *   result: 'ok',
   *   status: 'building',
   *   settings: {
   *     Package: 'morio-client',
   *     Source: 'morio-client',
   *     Section: 'utils',
   *     Priority: 'optional',
   *     Architecture: 'amd64',
   *     Essential: 'no',
   *     'Installed-Size': 5000,
   *     Maintainer: 'CERT-EU <services@cert.europa.eu>',
   *     'Changed-By': 'Joost De Cock <joost.decock@cert.europa.eu>',
   *     Homepage: 'https://github.com/certeu/morio',
   *     Description: 'The Morio client collects and ships observability data to a Morio instance.\n' +
   *       '  Deploy this Morio client (based on Elastic Beats) on your endpoints,\n' +
   *       '  and collect their data on one or more centralized Morio instances\n' +
   *       '  for analysis, further processing, downstream routing & filtering,\n' +
   *       '  or event-driven automation.',
   *     'Vcs-Git': 'https://github.com/certeu/morio -b main [clients/linux]',
   *     Version: '0.1.6-1'
   *   }
   * }
   */
  it(`Should POST /pkgs/clients/deb/build`, async () => {
    const settings = {
      ...store.pkg_deb_defaults,
      Revision: 42,
      Description: 'Custom Description for Unit Tests',
    }
    const result = await core.post(`/pkgs/clients/deb/build`, settings)
    const d = result[1]
    assert.equal(Array.isArray(result), true)
    assert.equal(result.length, 3)
    assert.equal(result[0], 201)
    assert.equal(typeof d, 'object')
    assert.equal(d.result, 'ok')
    assert.equal(d.status, 'building')
    for (const key of Object.keys(settings)) {
      if (
        ![
          'Depends',
          'Uploaders',
          'Description',
          'DetailedDescription',
          'Version',
          'Revision',
        ].includes(key)
      ) {
        assert.equal(d.settings[key], settings[key])
      }
    }
    assert.equal(d.settings.Version, `${settings.Version}-${settings.Revision}`)
    equalIgnoreSpaces(
      d.settings.Description,
      settings.Description + '\n  ' + settings.DetailedDescription
    )
  })
})
