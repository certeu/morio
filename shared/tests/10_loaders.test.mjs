import 'dotenv/config'
import { loadPreseededSettings } from '../src/loaders.mjs'
import { describe, it } from 'node:test'
import { strict as assert } from 'node:assert'
import { logger } from '../src/logger.mjs'

/*
 * Logger object
 */
const log = logger(10, 'shared-tests')

/*
 * Git root
 */
const gitroot = '/tmp'

const tests = {
  anyJson:
    'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/any.json',
  anyYaml:
    'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/any.yaml',
  anyYml:
    'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/any.yml',
  github: {
    base: {
      github: {
        owner: 'certeu',
        repo: 'morio-test-data',
        file_path: 'unit-tests/shared/loaders/any.yml',
        ref: 'main',
        token: process.env.GITHUB_TOKEN,
      },
    },
  },
  gitlab: {
    base: {
      gitlab: {
        project_id: 61397500,
        file_path: 'unit-tests/shared/loaders/any.yml',
        ref: 'main',
        token: process.env.GITLAB_TOKEN,
      },
    },
  },
  git: {
    github: {
      url: 'https://github.com/certeu/morio-test-data.git',
      ref: 'main',
      user: 'joostdecock',
      token: process.env.GITHUB_TOKEN,
    },
    gitlab: {
      url: 'https://gitlab.com/morio/test-data.git',
      ref: 'main',
      user: 'joostdecock',
      token: process.env.GITLAB_TOKEN,
    },
  },
}

tests.overlays = {
  url: {
    base: tests.anyJson,
    overlays:
      'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/overlay1.yml',
  },
  urls: {
    base: tests.anyJson,
    overlays: [
      'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/overlay1.yml',
      'https://raw.githubusercontent.com/certeu/morio-test-data/main/unit-tests/shared/loaders/overlay2.yml',
    ],
  },
}

//describe('Shared Loaders: Preseed Base Settings', () => {
//  /*
//   * Just a URL
//   */
//  it('Should load JSON from a URL', async () => {
//    const settings = await loadPreseededSettings(tests.anyJson, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "json")
//  })
//
//  it('Should load YAML from a URL (.yaml)', async () => {
//    const settings = await loadPreseededSettings(tests.anyYaml, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  it('Should load YAML from a URL (.yml)', async () => {
//    const settings = await loadPreseededSettings(tests.anyYml, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * URL in .url
//   */
//  it('Should load JSON from .url', async () => {
//    const settings = await loadPreseededSettings({ url: tests.anyJson }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "json")
//  })
//
//  it('Should load YAML from .url (.yaml)', async () => {
//    const settings = await loadPreseededSettings({ url: tests.anyYaml }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  it('Should load YAML from .url (.yml)', async () => {
//    const settings = await loadPreseededSettings({ url: tests.anyYml }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * URL in .base
//   */
//  it('Should load JSON from .base', async () => {
//    const settings = await loadPreseededSettings({ base: tests.anyJson }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "json")
//  })
//
//  it('Should load YAML from .base (.yaml)', async () => {
//    const settings = await loadPreseededSettings({ base: tests.anyYaml }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  it('Should load YAML from .base (.yml)', async () => {
//    const settings = await loadPreseededSettings({ base: tests.anyYml }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * URL in .base.url
//   */
//  it('Should load JSON from .base.url', async () => {
//    const settings = await loadPreseededSettings({ base: { url: tests.anyJson } }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "json")
//  })
//
//  it('Should load YAML from .base.url (.yaml)', async () => {
//    const settings = await loadPreseededSettings({ base: { url: tests.anyYaml } }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  it('Should load YAML from .base.url (.yml)', async () => {
//    const settings = await loadPreseededSettings({ base: { url: tests.anyYml } }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * GitHub
//   */
//  it('Should load data from the GitHub API', async () => {
//    const settings = await loadPreseededSettings(tests.github, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * GitHub (non-default branch)
//   */
//  it('Should load data from the GitHub API (alt branch)', async () => {
//    const settings = await loadPreseededSettings({
//      base: {
//        github: {
//          ...tests.github.base.github,
//          ref: "alt",
//          file_path: tests.github.base.github.file_path.replace("any.yml", "alt.yml")
//        }
//      }
//    }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.branch, "alt")
//  })
//
//  /*
//   * GitLab
//   */
//  it('Should load data from the GitLab API', async () => {
//    const settings = await loadPreseededSettings(tests.gitlab, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * GitLab (non-default branch)
//   */
//  it('Should load data from the GitLab API (alt branch)', async () => {
//    const settings = await loadPreseededSettings({
//      base: {
//        gitlab: {
//          ...tests.gitlab.base.gitlab,
//          ref: "alt",
//          file_path: tests.gitlab.base.gitlab.file_path.replace("any.yml", "alt.yml")
//        }
//      }
//    }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.branch, "alt")
//  })
//
//  /*
//   * Git, clone from GitHub
//   */
//  it('Should load data from a cloned GitHub repository', async () => {
//    const settings = await loadPreseededSettings({
//      git: tests.git,
//      base: `git:${tests.github.base.github.file_path}@github`,
//    }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//  /*
//   * Git, clone from GitHub (non-default branch)
//   */
//  it('Should load data from a cloned GitHub repository', async () => {
//    const settings = await loadPreseededSettings({
//      git: {
//        github: {
//          ...tests.git.github,
//          ref: "alt"
//        }
//      },
//      base: `git:${tests.github.base.github.file_path.replace("any.yml", "alt.yml")}@github`,
//    }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.branch, "alt")
//  })
//
//  /*
//   * Git, clone from GitLab
//   */
//  it('Should load data from a cloned GitLab repository', async () => {
//    const settings = await loadPreseededSettings({
//      git: tests.git,
//      base: `git:${tests.github.base.github.file_path}@gitlab`,
//    }, log, gitroot)
//    assert.equal(typeof settings, 'object')
//    assert.equal(settings.any, "yaml")
//  })
//
//})

describe('Shared Loaders: Preseed Settings Overlays', () => {
  /*
   * Simple URL
   */
  it('Should load overlay from a URL', async () => {
    const settings = await loadPreseededSettings(tests.overlays.url, log, gitroot)
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 1)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
  })

  /*
   * An array of URLs
   */
  it('Should load overlays from an Array of URLs', async () => {
    const settings = await loadPreseededSettings(tests.overlays.urls, log, gitroot)
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * A fully configured GitHub object
   */
  it('Should load overlay from the GitHub API', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.overlays.url,
        overlays: [
          {
            github: {
              ...tests.github.base.github,
              file_path: 'unit-tests/shared/loaders/overlay1.yml',
            },
          },
          {
            github: {
              ...tests.github.base.github,
              file_path: 'unit-tests/shared/loaders/overlay2.json',
            },
          },
        ],
      },
      log,
      gitroot
    )
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * A reference to the base GitHub config
   */
  it('Should load overlay from the GitHub API (ref to base)', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.github,
        overlays: [
          'unit-tests/shared/loaders/overlay1.yml@github',
          'unit-tests/shared/loaders/overlay2.json@github',
        ],
      },
      log,
      gitroot
    )
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * A fully configured GitLab object
   */
  it('Should load overlay from the GitLab API', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.overlays.url,
        overlays: [
          {
            gitlab: {
              ...tests.gitlab.base.gitlab,
              file_path: 'unit-tests/shared/loaders/overlay1.yml',
            },
          },
          {
            gitlab: {
              ...tests.gitlab.base.gitlab,
              file_path: 'unit-tests/shared/loaders/overlay2.json',
            },
          },
        ],
      },
      log,
      gitroot
    )
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * A reference to the base GitLab config
   */
  it('Should load overlay from the GitLab API (ref to base)', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.gitlab,
        overlays: [
          'unit-tests/shared/loaders/overlay1.yml@gitlab',
          'unit-tests/shared/loaders/overlay2.json@gitlab',
        ],
      },
      log,
      gitroot
    )

    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * From git repos
   */
  it('Should load overlay from cloned git repositories', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.overlays.url,
        git: tests.git,
        overlays: [
          'git:unit-tests/shared/loaders/overlay1.yml@github',
          'git:unit-tests/shared/loaders/overlay2.json@gitlab',
        ],
      },
      log,
      gitroot
    )
    assert.equal(typeof settings, 'object')
    assert.equal(settings.overlay, 2)
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })

  /*
   * From git repos (glob)
   */
  it('Should load overlay from cloned git repositories (glob)', async () => {
    const settings = await loadPreseededSettings(
      {
        ...tests.overlays.url,
        git: tests.git,
        overlays: 'git:unit-tests/shared/loaders/overlay*.yml@github',
      },
      log,
      gitroot
    )
    assert.equal(typeof settings, 'object')
    assert.equal(settings.nested.property, true)
    assert.equal(settings.nested.overlay.one, true)
    assert.equal(settings.nested.overlay.two, true)
  })
})
