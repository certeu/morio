import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import presets from '/etc/morio/shared/presets.yaml'

const ConfigPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl">
          <table className="table">
            <thead>
              <tr>
                <th className="text-right">Preset</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(presets).map(([key, val]) => (
                <tr key={key}>
                  <td className="text-right">
                    <b>{key}</b>
                  </td>
                  <td>
                    <code>{val}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
