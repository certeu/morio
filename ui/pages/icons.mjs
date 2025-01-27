import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import * as allIcons from 'components/icons.mjs'

const custom = {
  HttpIcon: {stroke: 0, fill: true},
}

const DashboardsPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props}>
        <div className="max-w-4xl">
          <div className="flex flex-row flex-wrap gap-4 items-center justify-between items-stretch">
            {Object.entries(allIcons).filter(([name]) => name !== 'IconWrapper').map(([name, Icon]) => (
              <div key={name} className="border rounded-lg p-4 flex flex-col items-center gap-4">
                {custom[name] ? <Icon {...custom[name]} /> : <Icon />}
                <span className="text-xs opacity-70">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DashboardsPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Icons',
    page: ['icons'],
  },
})
