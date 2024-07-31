/*
 * Eslint does not support import assertions because they only
 * support stage-4 language features.
 *
 * It's annoying and can't be disabled. So instead this file
 * will import all JSON and you can then import it from here.
 *
 * This way, we just ignore this file in eslint and voila.
 * See: https://github.com/eslint/eslint/discussions/15305#discussioncomment-8181665
 */
// Anonymous
import caCertificates from './ca-certificates.json' with { type: 'json' }
import downloads from './downloads.json' with { type: 'json' }
import idps from './idps.json' with { type: 'json' }
import jwks from './jwks.json' with { type: 'json' }
import status from './status.json' with { type: 'json' }
import validateSettings from './validate-settings.json' with { type: 'json' }
// Accounts
import listAccounts from './list-accounts.json' with { type: 'json' }
import createAccount from './create-account.json' with { type: 'json' }
import activateAccount from './activate-account.json' with { type: 'json' }
import activateMfa from './activate-mfa.json' with { type: 'json' }
// API keys
import createApikey from './create-apikey.json' with { type: 'json' }
import listApikeys from './list-apikeys.json' with { type: 'json' }
import updateApikey from './update-apikey.json' with { type: 'json' }
// Authentication
import login from './login.json' with { type: 'json' }
import whoami from './whoami.json' with { type: 'json' }
// Client packages
import pkgBuildDeb from './pkg-build.deb.json' with { type: 'json' }
// Cluster
import clusterHeartbeat from './cluster-heartbeat.json' with { type: 'json' }
import clusterJoin from './cluster-join.json' with { type: 'json' }
// Cryptopgraphy
import createCertificate from './create-certificate.json' with { type: 'json' }
import encrypt from './encrypt.json' with { type: 'json' }
// Settings
import settingsSanitized from './settings.sanitized.json' with { type: 'json' }
import setupRes from './setup.res.json' with { type: 'json' }
import presets from './presets.json' with { type: 'json' }

// Objects
import jwt from './jwt.json' with { type: 'json' }
import keys from './keys.json' with { type: 'json' }
import pkgDefaults from './pkg-defaults.json' with { type: 'json' }
import settingsCluster1 from './settings.cluster.1.json' with { type: 'json' }
import settingsCluster3 from './settings.cluster.3.json' with { type: 'json' }
import settingsIam from './settings.iam.json' with { type: 'json' }
import settingsTokens from './settings.tokens.json' with { type: 'json' }
import settingsUi from './settings.ui.json' with { type: 'json' }

export const settings = {
  cluster1: {
    ...settingsCluster1,
    ...settingsTokens,
    ...settingsIam,
    ...settingsUi,
  },
  cluster3: {
    ...settingsCluster3,
    ...settingsTokens,
    ...settingsIam,
    ...settingsUi,
  },
}

/*
 * Combine the cluster join request
 */
clusterJoin.req.settings.data = settingsSanitized
clusterJoin.req.settings.keys = keys

export const examples = {
  obj: {
    keys,
    jwt: jwt.jwt,
    settings,
    pkgDefaults,
  },
  req: {
    activateAccount: activateAccount.req,
    activateMfa: activateMfa.req,
    cluster: {
      heartbeat: clusterHeartbeat.req,
      join: clusterJoin.req,
    },
    createAccount: createAccount.req,
    createCertificate: createCertificate.req,
    decrypt: encrypt.res,
    encrypt: encrypt.req,
    login: login.req,
    pkgBuild: {
      deb: pkgBuildDeb.req,
    },
  },
  res: {
    activateAccount: activateAccount.res,
    activateMfa: activateMfa.res,
    caCertificates,
    cluster: {
      heartbeat: clusterHeartbeat.res,
      join: clusterJoin.res,
    },
    createAccount: createAccount.res,
    createApikey: createApikey.res,
    createCertificate: createCertificate.res,
    setup: setupRes,
    downloads,
    decrypt: encrypt.req,
    encrypt: encrypt.res,
    idps,
    jwks,
    listAccounts,
    listApikeys,
    login: login.res,
    pkgBuild: {
      deb: pkgBuildDeb.res,
    },
    pkgDefaults: {
      deb: pkgDefaults.deb,
    },
    presets,
    reload: {
      ...status,
      settings: settingsSanitized,
      keys,
      presets
    },
    status,
    settingsSanitized,
    updateApikey,
    validateSettings: {
      ...validateSettings,
      validated_settings: settings.cluster1,
    },
    whoami,
  },
}
