import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import {
  CheckCircleIcon,
  FingerprintIcon,
  FixmeIcon,
  FlagIcon,
  FlipoverIcon,
  LogsIcon,
  SearchIcon,
  StatusIcon,
  TipIcon,
} from 'components/icons.mjs'
import { Card } from 'components/card.mjs'

const types = {
  audit: {
    about:
      'This is low-level audit data collected by the Morio client, made available through the cache.',
    Icon: FingerprintIcon,
  },
  events: {
    about:
      'Keep track of events throughout your infrastructure, such as logins, software changes, and so on',
    Icon: FlagIcon,
  },
  checks: {
    about: `Keep track of what matters through Morio's watcher service, then go here to see what's up (or down)`,
    Icon: CheckCircleIcon,
  },
  logs: {
    about: (
      <>
        Like <code>tail -f</code> but without a need to have access to the machine where the logs
        are generated
      </>
    ),
    Icon: LogsIcon,
  },
  metrics: {
    about: `Probably the most satisfying dashboards to look at, great for investigations too`,
    Icon: StatusIcon,
  },
  notes: {
    about:
      'Notes is how the Tap service communicates, as generating logs would cause a snowball effect',
    Icon: TipIcon,
  },
}

const meta = {
  title: 'Morio Dashboards',
  page: ['boards'],
  Icon: FlipoverIcon,
}

export default function DashboardsPage() {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <div className="max-w-4xl">
          <h3>Top Picks</h3>
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            <Card
              role="user"
              title={<span className="capitalize">Search Dashboards</span>}
              href={`/boards/search/`}
              desc="Find dashboards based on hostname, Morio module name, or other criteria"
              width="w-full"
              Icon={SearchIcon}
            />
            <Card
              role="user"
              title={<span className="capitalize">Custom Dashboards</span>}
              href={`/boards/custom/`}
              desc="Create your own dashboards, or browse dashboards created by others"
              width="w-full"
              Icon={FixmeIcon}
            />
          </div>
          <h3 className="mt-8">Per data type</h3>
          <div className="grid grid-cols-2 gap-4 items-center justify-between items-stretch">
            {Object.keys(types).map((type) => {
              const { about, Icon } = types[type]
              return (
                <Card
                  key={type}
                  role="user"
                  title={<span className="capitalize">{type}</span>}
                  href={`/boards/${type}/`}
                  desc={about}
                  width="w-full"
                  Icon={Icon}
                />
              )
            })}
          </div>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}
