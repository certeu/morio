/*
 * Load vars from a .env file. See .env.example
 */
import 'dotenv/config'
/*
 * Load Playwright dependencies
 */
import { defineConfig, devices } from '@playwright/test'

/**
 * @see https://playwright.dev/docs/test-configuration
 */
const config = defineConfig({
  /*
   * This is where we keep the tests
   * Note that we have different test suites, you should
   * specify which one to run with the MORIO_TEST_SUITE var
   * although if you use the run scripts, they are preset.
   * See: https://morio.it/docs/reference/contributors/monorepo/run-scripts/
   */
  testDir: `./test-suites/${process.env.MORIO_TEST_SUITE}/`,

  /*
   * Make shell completion go to tests
   */
  outputDir: "./.test-results",

  /*
   * Run tests in files in parallel
   */
  fullyParallel: true,

  /*
   * Fail the build on CI if you accidentally left test.only in the source code.
   */
  forbidOnly: !!process.env.CI,

  /*
   * Retry on CI only
   */
  retries: process.env.CI ? 2 : 0,

  /*
   * Opt out of parallel tests on CI.
   */
  workers: process.env.CI ? 1 : undefined,

  /*
   * Reporter to use. See https://playwright.dev/docs/test-reporters
   */
  reporter: 'line',

  /*
   * Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
   */
  use: {
    /*
     * Base URL to use in tests.
     * You can control this with the following variables in a .env file:
     * - MORIO_TEST_DOMAIN : Controls the domain
     * - MORIO_TEST_TLS : Set this to use TLS (https)
     * - MORIO_TEST_PORT : Set this to use a non-standard port (443 for https, 80 for http)
     */
    baseURL: `${process.env.MORIO_TEST_TLS
     ? 'https://'
     : 'http://' }${process.env.MORIO_TEST_DOMAIN
     }:${process.env.MORIO_TEST_PORT
       ? process.env.MORIO_TEST_PORT
       : process.env.MORIO_TEST_TLS
         ? 443
         : 80
     }`,

    /*
     * Do not balk at certificate issues
     */
    ignoreHTTPSErrors: true,

    /*
     * Collect trace when retrying the failed test.
     * See https://playwright.dev/docs/trace-viewer
     */
    trace: 'on-first-retry',
  },

  /*
   * We test only with Firefox.
   * We are not testing for pixel-perfect cross browser behaviour,
   * but rather making sure things work as expected when talking to the API.
   */
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
})

/*
 * Playwright expects a default export
 */
export default config
