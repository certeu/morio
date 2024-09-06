import { resolveHost, testUrl } from '#shared/network'
import { utils, log } from './utils.mjs'

/**
 * Validates Morio settings
 *
 * This will not catch all problems, but it should at least catch some common
 * settings issues, in particular for people writing their own settings.
 *
 * @param {object} newSettings - The settings to validate
 * @retrun {object} report - An object detailing the results of the validation
 */
export async function validateSettings(newSettings) {
  /*
   * Set up the report skeleton that we will return
   */
  const report = {
    valid: true,
    deployable: true,
    errors: [],
    warnings: [],
    info: [],
  }

  /*
   * Schema validation successful (was done in the request handler)
   */
  report.info.push('Settings passed schema validation')

  /*
   * We define this here to keep things DRY
   */
  const abort = () => {
    report.warnings.push(`Validation was terminated before completion due to errors`)
    report.deployable = false
    report.valid = false

    return report
  }

  /*
   * Broker nodes
   */
  if (
    !newSettings?.cluster ||
    !newSettings.cluster.broker_nodes ||
    !Array.isArray(newSettings.cluster.broker_nodes) ||
    ![1, 3, 5, 7, 9].includes(newSettings.cluster.broker_nodes.length)
  ) {
    report.info.push(`Settings are not valid`)
    report.errors.push(`Broker node count is not supported`)

    return abort()
  }

  /*
   * Broker nodes
   */
  if (
    newSettings.cluster.flanking_nodes &&
    (!Array.isArray(newSettings.cluster.flanking_nodes) ||
      newSettings.cluster.flanking_nodes.length < 0 ||
      newSettings.cluster.flanking_nodes.length < 36)
  ) {
    report.info.push(`Settings are not valid`)
    report.errors.push(`Flanking node count is not supported`)

    return abort()
  }

  /*
   * Verify nodes
   */
  let i = 0
  const ips = []
  const ipPromises = []
  for (const node of newSettings.cluster.broker_nodes) {
    i++
    report.info.push(`Validating node ${i}: ${node}`)
    /*
     * Verify node name resolution
     */
    ipPromises.push(
      resolveHost(node).then(([resolved, ipsOrError]) => {
        if (resolved) {
          report.info.push(`Node ${i} resolves to: ${ipsOrError.join()}`)
          ips.push(...ipsOrError)
        } else {
          report.info.push(`Validation failed for node ${i}`)
          report.errors.push(ipsOrError)

          return abort()
        }
      })
    )
  }
  await Promise.all(ipPromises)

  /*
   * If some of the nodes resolve to the same IP, that is probably going to be a problem
   */
  if (ips.length !== [...new Set([...ips])].length) {
    report.errors.push('Different nodes share a common IP address')

    return abort()
  }

  const httpPromises = []
  for (const node of newSettings.cluster.broker_nodes) {
    /*
     * Try contacting nodes over HTTPS, ignore certificate
     * We bypass this when it's the unit test node
     */
    const url = `https://${node}/${utils.getPreset('MORIO_API_PREFIX')}/status`
    if (node !== utils.getPreset('MORIO_UNIT_TEST_HOST')) {
      httpPromises.push(
        await testUrl(url, { ignoreCertificate: true, returnAs: 'json' }, log.debug).then(
          (status) => {
            if (status?.info) report.info.push(`Node ${i} is reachable over HTTPS`)
            else {
              report.info.push(`Validation failed for node ${i}`)
              report.errors.push(`Unable to reach node ${i} at: https://${node}/`)

              return abort()
            }

            if (status.state?.ephemeral) {
              report.info.push(`Node ${i} runs Morio and is ready for setup`)
            } else {
              if (status.info?.name === '@morio/api') {
                report.warnings.push(
                  `Node ${i} runs Morio, but is not in ephemeral mode, its settings would be overwritten`
                )
              } else {
                report.errors.push(`Node ${i} does not seem to run Morio`)
                abort()
              }
            }
          }
        )
      )
    } else {
      report.info.push(`This is the unit test host, not validating HTTPS connection.`)
    }
  }
  await Promise.all(httpPromises)

  /*
   * Looks good
   */
  report.validated_settings = newSettings

  return report
}
