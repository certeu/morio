import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Highlight } from 'components/highlight.mjs'

const ConfigPage = (props) => {
  const [presets, setPresets] = useState(false)
  const { api } = useApi()

  useEffect(() => {
    const loadPresets = async () => {
      const result = await api.getPresets()
      if (result[1] === 200) setPresets(result[0])
    }
    if (!presets) loadPresets()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl mx-auto">
          <Highlight js={presets} title="Morio Settings" />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Presets',
    page: ['settings', 'presets'],
  },
})
