/*
 * For now, we are importing terminology manually
 * We might change this at one point to handle this in an automated way
 * For now, if you create a new terminology page, please update this
 */
import { frontMatter as brokerNode } from './docs/reference/terminology/broker-node/readme.md'
import { frontMatter as ephemeralMode } from './docs/reference/terminology/ephemeral-mode/readme.md'
import { frontMatter as ephemeralNode } from './docs/reference/terminology/ephemeral-node/readme.md'
import { frontMatter as flankingNode } from './docs/reference/terminology/flanking-node/readme.md'
import { frontMatter as flankingService } from './docs/reference/terminology/flanking-service/readme.md'
import { frontMatter as settings } from './docs/reference/terminology/settings/readme.md'
import { frontMatter as moriod } from './docs/reference/terminology/moriod/readme.md'
// Services
import { frontMatter as apiService } from './docs/reference/terminology/api-service/readme.md'
import { frontMatter as brokerService } from './docs/reference/terminology/broker-service/readme.md'
import { frontMatter as caService } from './docs/reference/terminology/ca-service/readme.md'
import { frontMatter as connectorService } from './docs/reference/terminology/connector-service/readme.md'
import { frontMatter as consoleService } from './docs/reference/terminology/console-service/readme.md'
import { frontMatter as coreService } from './docs/reference/terminology/core-service/readme.md'
import { frontMatter as dbService } from './docs/reference/terminology/db-service/readme.md'
import { frontMatter as dbuilderService } from './docs/reference/terminology/dbuilder-service/readme.md'
import { frontMatter as mbuilderService } from './docs/reference/terminology/mbuilder-service/readme.md'
import { frontMatter as proxyService } from './docs/reference/terminology/proxy-service/readme.md'
import { frontMatter as rbuilderService } from './docs/reference/terminology/rbuilder-service/readme.md'
import { frontMatter as uiService } from './docs/reference/terminology/ui-service/readme.md'
import { frontMatter as wbuilderService } from './docs/reference/terminology/wbuilder-service/readme.md'

export const terminology = {
  'broker node': {
    title: brokerNode.title,
    url: `/docs/reference/terminology/broker-node`,
  },
  'ephemeral mode': {
    title: ephemeralMode.title,
    url: `/docs/reference/terminology/ephemeral-mode`,
  },
  'ephemeral node': {
    title: ephemeralNode.title,
    url: `/docs/reference/terminology/ephemeral-node`,
  },
  'flanking node': {
    title: flankingNode.title,
    url: `/docs/reference/terminology/flanking-node`,
  },
  'flanking service': {
    title: flankingService.title,
    url: `/docs/reference/terminology/flanking-service`,
  },
  'moriod': {
    title: moriod.title,
    url: `/docs/reference/terminology/moriod`,
  },
  'settings': {
    title: settings.title,
    url: `/docs/reference/terminology/settings`,
  },
  // Services
  'api service': {
    title: apiService.title,
    url: `/docs/reference/terminology/api-service`,
  },
  'broker service': {
    title: brokerService.title,
    url: `/docs/reference/terminology/broker-service`,
  },
  'ca service': {
    title: caService.title,
    url: `/docs/reference/terminology/ca-service`,
  },
  'connector service': {
    title: connectorService.title,
    url: `/docs/reference/terminology/connector-service`,
  },
  'console service': {
    title: consoleService.title,
    url: `/docs/reference/terminology/console-service`,
  },
  'core service': {
    title: coreService.title,
    url: `/docs/reference/terminology/core-service`,
  },
  'db service': {
    title: dbService.title,
    url: `/docs/reference/terminology/db-service`,
  },
  'dbuilder service': {
    title: dbuilderService.title,
    url: `/docs/reference/terminology/dbuilder-service`,
  },
  'mbuilder service': {
    title: mbuilderService.title,
    url: `/docs/reference/terminology/mbuilder-service`,
  },
  'proxy service': {
    title: proxyService.title,
    url: `/docs/reference/terminology/proxy-service`,
  },
  'rbuilder service': {
    title: rbuilderService.title,
    url: `/docs/reference/terminology/rbuilder-service`,
  },
  'ui service': {
    title: uiService.title,
    url: `/docs/reference/terminology/ui-service`,
  },
  'wbuilder service': {
    title: wbuilderService.title,
    url: `/docs/reference/terminology/wbuilder-service`,
  },
}

/*
 * This is the jargon for the Morio documentation site
 */
export const jargon = {
  ami: {
    title: 'AMI',
    content: `<p>An <b>Amazon Machine Image</b> (AMI) is a type of virtual machine image format suitable for deployment on <a href="https://aws.amazon.com/pm/ec2/">the EC2 compute service</a> of <a href="https://aws.amazon.com/">Amazon Web Services</a> (AWS).</p>`
  },
  aws: {
    title: 'AWS',
    content: `<p><b>Amazon Web Services</b> is the world's largest clould service provider.
    <br />Learn more at <a href="https://aws.amazon.com/">aws.amazon.com</a>.</p>`
  },
  "cert-eu": {
    title: 'CERT-EU',
    content: `
<p>
  CERT-EU is the <b>Cybersecurity Service for the Institutions, Bodies, Offices and Agencies of the <a href="https://europa.eu/">European Union</a></b>, the home of Morio.
</p>
<p>Learn more at <a href="https://cert.europa.eu/">cert.europa.eu</a>.</p>
`
  },
  ci: {
    title: 'CI',
    content: `<p><b>CI</b> stands for <b>Continious Integration</b>. In the context of Morio, we use it as shorthand for CI/CD, which combines CI with <b>Continious Deployment</b>. We use CI to refer to the automation in building, testing, and deploying changes in software.</p>
   <p>To learn more, the <a href="https://en.wikipedia.org/wiki/Continuous_integration">CI</a> and <a href="https://en.wikipedia.org/wiki/CI/CD">CI/CD</a> articles on Wikipedia are a good starting point.</p>`,
  },
  dry: {
    title: "DRY",
    content: `
<p>
In programming, <b>DRY</b> stands for <b>Don’t Repeat Yourself</b>.
The idea being that you should not write the same thing twice, rather everything should have its place.
</p>
<p>This way, when you need to make a change, you only need to change it in one place.</p>`,
  },
  iicb: {
    title: 'IICB',
    content: `<p>The IICB is the European Union's <b>Interinstitutional Cybersecurity Board</b> and the governing body of <b>CERT-EU</b>, the home of Morio.</p>`
  },
  mdx: {
    title: 'MDX',
    content: `<p>MDX lets you use JSX in your markdown content. It allows you to import components, and embed them within your content. This makes writing markdown with custom components a blast.<p><p>Learn more at <a href="chttps://mdxjs.com">mdxjs.com</a></p>`
  },
  monorepo: {
    title: 'Morio Monorepo',
    content: '<p>The Morio monorepo, or <b>monorepo</b> for short, is the repository hosting the Morio source code.</p><p>You can find it at <a href="https://github.com/certeu/morio">github.com/certeu/morio</a></p>',
  },
  "run script": {
    title: 'NPM run scripts',
    content: '<p>NPM run scripts, or <b>run scripts</b> for short, refer to scripts defined in the <b>scripts</b> section of a NodeJS <b>package.json</b> file. These scripts are typically ysed for all sorts of housekeeping an automation.</p><p>For more info, refer to <a href="https://docs.npmjs.com/cli/v10/using-npm/scripts">the NPM docs on scripts</a></p>',
  },
  workspace: {
    title: 'Workspaces',
    content: `<p><b>NPM workspaces</b> is is a generic term that refers to the set of features in the <a href="https://docs.npmjs.com/cli/v10/">npm cli</a> that facilitate handling NodeJS dependencies inside a monorepo.</p><p>For example, both the <b>core</b> and <b>api</b> folders rely on common dependencies. Rather than installing them twice, through the use of workspaces they will be installed the monorepo root, and shared.</p><p>There is more to workspaces, as it is a somewhat advanced feature of NPM, but that's not really relevant for Morio. If you want to learn more, refer to <a href="https://docs.npmjs.com/cli/v10/using-npm/workspaces">the NPM documentation on workspaces</a>.</p>`
  }
}

/*
 * Jargon aliases
 */
jargon["run scripts"] = jargon["run script"]
jargon.workspaces = jargon.workspace



