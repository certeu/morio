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
    title: ephemeralMode.title,
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
  'settings': {
    title: settings.title,
    url: `/docs/reference/terminology/settings`,
  },
}

/*
 * This is the jargon for the Morio documentation site
 */
export const jargon = {
  "cert-eu": {
    title: 'CERT-EU',
    content: `
<p>
  CERT-EU is the <b>Cybersecurity Service for the Institutions, Bodies, Offices and Agencies of the <a href="https://europa.eu/">European Union</a></b>, the home of Morio.
</p>
<p>Learn more at <a href="https://cert.europa.eu/">cert.europa.eu</a>.</p>
`
  },
  dry: {
    title: "DRY: Don't Repeat Yourself",
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
}



