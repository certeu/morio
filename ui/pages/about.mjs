import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { useApi } from 'hooks/use-api.mjs'
import { useQuery } from '@tanstack/react-query'
import { Markdown } from 'components/markdown.mjs'

const defaultAboutMarkdown = `
We are still trying to find the best way to sum up Morio in a concise way.
This is what we have so far:

## One-liner
Morio is a ready-to-use observability platform that makes real-time monitoring
simple, whether you're watching logs, metrics, or system health across cloud
and on-premise infrastructure.

## Elevator pitch
Morio is an observability platform that gives you real-time insight into your
infrastructure without the complexity typically associated with monitoring
solutions. It handles logs, metrics, and system health data from both cloud and
on-premise systems, presenting everything in a single dashboard. Built by
CERT-EU's engineering team, it's designed to be simple to deploy and maintain,
while still providing enterprise-grade monitoring capabilities.

## Learn More/Morio
To learn more, refer to:

- The Morio documentation on [morio.it](https://morio.it)
- The Morio source code at [github.com/certeu/morio](https://github.com/certeu/morio)

## Change this page
You can change this content by [setting the \`morio/ui/markdown/about\` key
  in the KV store](/tools/kv/morio/ui/markdown/about).`

const AboutMarkdown = () => {
  const { api } = useApi()

  const key = 'morio/ui/markdown/about'
  const { data } = useQuery({
    queryKey: [key],
    queryFn: async () => {
      const result = await api.kvRead(key)
      if (result[1] === 200 && result[0].value) return result[0].value
      return false
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
  })

  return <Markdown>{data ? data : defaultAboutMarkdown}</Markdown>
}
const AboutPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <AboutMarkdown />
      </ContentWrapper>
    </PageWrapper>
  )
}
export default AboutPage

export const getStaticProps = () => ({
  props: {
    title: 'About Morio',
    page: ['about'],
  },
})
