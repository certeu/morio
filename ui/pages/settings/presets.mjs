import { useState, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { presetDocs, presetCategories } from 'lib/preset-docs.mjs'
import { AnchorLink } from 'components/link.mjs'
import { Markdown } from 'components/markdown.mjs'

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
        <div className="max-w-4xl">
          <h2>List</h2>
          <ul className="list list-disc list-inside ml-2">
            {Object.keys(presetCategories)
              .sort()
              .map((cat) => (
                <>
                  <li key={cat}>
                    <b>{presetCategories[cat]}</b>
                    <ul className="list list-disc list-inside ml-2">
                      {Object.keys(presets)
                        .filter((key) => key.split('_')[1] === cat)
                        .map((k) => (
                          <li key={k} className="ml-4 text-sm">
                            <AnchorLink id={k} txt={k} />
                          </li>
                        ))}
                    </ul>
                  </li>
                </>
              ))}
          </ul>
          <h2>Details</h2>
          {Object.keys(presetCategories)
            .sort()
            .map((cat) => (
              <>
                <h3 key={cat}>{presetCategories[cat]}</h3>
                {Object.keys(presets)
                  .filter((key) => key.split('_')[1] === cat)
                  .map((k) => (
                    <>
                      <h4 key={k} id={k}>
                        {k}
                      </h4>
                      <b>Value:</b> <code>{presets[k]}</code>
                      <br />
                      <b>Description:</b>
                      <Markdown>{presetDocs[k]}</Markdown>
                    </>
                  ))}
              </>
            ))}
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ConfigPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Presets',
    page: ['config', 'presets'],
  },
})
