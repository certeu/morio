// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { Card } from 'components/card.mjs'
import { DesktopIcon, PuzzleIcon, MegaphoneIcon } from 'components/icons.mjs'

const ClientActionsPage = (props) => (
  <PageWrapper {...props}>
    <ContentWrapper {...props} Icon={DesktopIcon} title={props.title}>
      <div
        className={`grid grid-cols-2 gap-4 items-center justify-between items-stretch max-w-4xl`}
      >
        <Card
          role="operator"
          title="Enroll clients"
          href="/actions/clients/enroll"
          desc="Guidance and examples that show how to join one or more clients to this Morio cluster."
          width="w-full"
          Icon={PuzzleIcon}
        />
        <Card
          role="operator"
          title="Send client commands"
          href="/actions/clients/cmd"
          desc="Send a command to one or more Morio clients. This requires clients to run in listener mode."
          width="w-full"
          Icon={MegaphoneIcon}
        />
      </div>
    </ContentWrapper>
  </PageWrapper>
)

export default ClientActionsPage

export const getStaticProps = () => ({
  props: {
    title: 'Client Actions',
    page: ['actions', 'clients'],
  },
})
