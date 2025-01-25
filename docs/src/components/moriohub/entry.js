import { useState} from 'react'
import Link from '@docusaurus/Link'
import { ModalWrapper } from '@site/src/theme/components/modal-wrapper.js'

export const HubEntry = ({ data, type, notes }) => {
  if (type === 'module') return <Module data={data} notes={notes} />
  if (type === 'overlay') return <Overlay data={data} notes={notes} />
  if (type === 'processor') return <Processor data={data} notes={notes} />

  return <pre>{JSON.stringify(data, null ,2)}</pre>
}

const Code = ({ children }) => (
  <code className="bg-neutral/10 p-1 rounded font-normal">{children}</code>
)

const PreCode = ({ children }) => (
  <pre className="bg-neutral/10 p-1 rounded font-normal witespace-pre">
    <code className="whitespace-pre">{children}</code>
  </pre>
)

const DarkCode = ({ children }) => (
  <pre className="bg-neutral text-neutral-content p-2 text-sm rounded font-normal witespace-pre">
    <code className="whitespace-pre">{children}</code>
  </pre>
)

const linkClasses = "text-sky-600 underline font-medium decoration-2 hover:decoration-4"

const agentNames = {
  audit: 'Auditbeat',
  logs: 'Filebeat',
  metrics: 'Metricbeat',
}

const PlusIcon = ({ className="w-6 h-6", stroke="none" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={stroke} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)


const Module = ({ data }) => {
  const [modal, setModal] = useState(false)

  const install = (
    <ModalWrapper closeHandler={() => setModal(false)}>
      <div className="">
        <H3>Install instructions</H3>
        <p className="mb-2">To add the <b>{data.title}</b> client module to your Morio setup, use these settings:</p>
        <DarkCode>{`preseed:
    git:
      moriohub:
        url: "https://github.com/certeu/moriohub.git"
    modules:
      - "git:/modules/*/*/${data.title}.yml@moriohub"`}
        </DarkCode>
      </div>
    </ModalWrapper>
  )

  if (modal) return modal

  return (
    <div className="tailwind">
      <Breadcrumbs type="modules" title={data.title} />
      <H1>
        <div className="flex flex-row flex-wrap gap-2 items-center w-full justify-between">
          <div>
            {data.title}
            <span className="block md:inline opacity-50 text-base pl:0 md:pl-4">a Morio Client Module</span>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(install)}>
            <PlusIcon stroke={2}/>
            Install Instructions
          </button>
        </div>
      </H1>
      <p>This module bundles configuration for the following agents:
        {Object.keys(data).sort().filter(key => key !== 'title').map((agent, i) => (
          <span className="px-1" key={agent}>
            <a className={linkClasses} href={`#${agent}`}>{agent}</a>
            {i +1 < Object.keys(data).filter(key => key !== 'title').length ? ',' : ''}
          </span>
        ))}
      </p>
      {Object.keys(data).sort().filter(key => key !== 'title').map(agent => (
        <div key={agent} className="" id={agent}>
          <H2>
            <div className="flex flex-row flex-wrap gap-2 items-center w-full justify-between">
              <div>
                <span className="capitalize">{agent}</span>
                <span className="text-sm font-medium pl-2 opacity-70">(template for {agentNames[agent]})</span>
              </div>
              <div>
                <KeyVal k='version' val={data[agent].moriodata.version} />
                <KeyVal k='OS' val={data.title.split('-')[0]} />
              </div>
            </div>
            <a
              href={`https://github.com/certeu/moriohub/tree/develop/modules${data[agent].location}`}
              className={`${linkClasses} text-sm -mt-1 block`}
            >
              {`/modules${data[agent].location}`}
            </a>
          </H2>
          <p>{data[agent].moriodata.info}</p>
          {data[agent].moriodata.vars
            ? (
              <>
                <H3>Client Variables</H3>
                <div className="pl-2">
                  {Object.entries(data[agent].moriodata.vars).map(([varKey, varInfo]) => (
                    <div key={varKey}>
                    <H4><span className="pr-2">{varKey}:</span>
                    {typeof varInfo.dflt === 'object'
                      ? <PreCode>{JSON.stringify(varInfo.dflt)}</PreCode>
                      : <Code>{varInfo.dflt}</Code>
                    }
                    </H4>
                    <p className="-mt-1">{varInfo.info}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
        </div>
      ))}
    </div>
  )
}

const Overlay = ({ data, notes=false }) => {
  const [modal, setModal] = useState(false)

  const install = (
    <ModalWrapper closeHandler={() => setModal(false)}>
      <div className="">
        <H3>Install instructions</H3>
        <H4>Apply the <em>{data.title}</em> overlay</H4>
        <DarkCode>{data.raw}</DarkCode>
        <H4>Preseed the <em>{data.title}</em> overlay</H4>
        {notes?.frontMatter?.preseed === false ? (
          <p className="opacity-70 italic">This overlay cannot be preseeded.</p>
        ) : (
          <DarkCode>{notes?.frontMatter?.presinstall_raw ? 'test' : `preseed:
    git:
      moriohub:
        url: "https://github.com/certeu/moriohub.git"
    overlays:
      - "git:/overlays/${data.title}.yml@moriohub"`}
          </DarkCode>
          )}
      </div>
    </ModalWrapper>
  )

  if (modal) return modal
  return (
    <div className="tailwind">
      <div className="max-w-5xl mx-auto mb-12">
        <Breadcrumbs type="overlays" title={data.title} />
        <H1>
          <div className="flex flex-row flex-wrap gap-2 items-center w-full justify-between">
            <div>
              {data.title}
              <span className="opacity-50 text-base pl-0 md:pl-4 block md:inline">a Morio Settings Overlay</span>
            </div>
            {notes?.frontMatter?.disable_install ? (
              <button className="btn btn-primary" disabled>
                <PlusIcon stroke={2}/>
                Install Instructions
              </button>
            ) : (
            <button className="btn btn-primary" onClick={() => setModal(install)}>
              <PlusIcon stroke={2}/>
              Install Instructions
            </button>
            )}
          </div>
        </H1>
        <p>{data.moriodata.info}</p>
        <Notes notes={notes} data={data}/>
      </div>
    </div>
  )
}

const Processor = ({ data, notes=false }) => {
  const [modal, setModal] = useState(false)
  const install = (
    <ModalWrapper closeHandler={() => setModal(false)}>
      <div className="">
        <H3>Install instructions</H3>
        <p className="mb-2">To add the <b>{data.title}</b> stream processor to your Morio setup, use these settings:</p>
        <DarkCode>{notes?.frontMatter?.install_raw ? 'test' : `preseed:
    git:
      moriohub:
        url: "https://github.com/certeu/moriohub.git"
    processors:
      - "git:/processors/${data.title}/**@moriohub"`}
        </DarkCode>
      </div>
    </ModalWrapper>
  )

  if (modal) return modal
  return (
    <div className="tailwind">
      <div className="max-w-5xl mx-auto mb-12">
        <Breadcrumbs type="processors" title={data.title} />
        <H1>
          <div className="flex flex-row flex-wrap gap-2 items-center w-full justify-between">
            <div>
              {data.title}
              <span className="opacity-50 text-base pl-0 md:pl-4 block md:inline">a Morio Stream Processor</span>
            </div>
            <button className="btn btn-primary" onClick={() => setModal(install)}>
              <PlusIcon stroke={2}/>
              Install Instructions
            </button>
          </div>
        </H1>
        <a
          className={`${linkClasses} text-sm -mt-8 mb-6 block`}
          href={`https://github.com/certeu/moriohub/tree/develop/processors/${
            data.title}`}
        >
         /processors/{data.title}
       </a>
        <p>{data.moriodata.info}</p>
        {data?.modules ? (
          <>
            <H2>Modules</H2>
            <p>This stream processor is modular. It has the following pluggable modules:</p>
            {Object.keys(data.modules).sort().map(mod => (
              <div key={mod}>
                <H3>
                  {mod}
                  <a
                    className={`${linkClasses} text-sm -mt-1 block`}
                    href={`https://github.com/certeu/moriohub/blob/develop/processors/${
                      data.title}/modules/${mod}.mjs`}
                  >
                    /processors/{data.title}/modules/{mod}.mjs
                  </a>
                </H3>
                <p>{data.modules[mod].moriodata.info}</p>
              </div>
            ))}
          </>
        ) : null}
        <Notes notes={notes} data={data}/>
      </div>
    </div>
  )
}

const Null = () => null

const Notes = ({ notes }) => {
  if (!notes?.default) return null
  const Mdx = notes?.default ? notes.default : Null

  return (
    <div className="markdown prose md:prose-lg mt-8">
      <Mdx />
    </div>
  )
}



export const Breadcrumbs = ({ type, title=false }) => (
  <nav className="theme-doc-breadcrumbs breadcrumbsContainer_T5ub" aria-label="Breadcrumbs">
    <ul className="breadcrumbs">
      <li className="breadcrumbs__item">
        <Link
          aria-label="Home page"
          className={`breadcrumbs__link p-0 m-0 ${linkClasses}`}
          href="/"
        >
          <HomeIcon />
        </Link>
      </li>
      <li
        className="breadcrumbs__item"
      >
        <Link className={`breadcrumbs__link ${linkClasses}`} href={`/hub/`}>
          moriohub
        </Link>
      </li>
      <li
        className="breadcrumbs__item"
      >
        {title ? (
        <Link className={`breadcrumbs__link ${linkClasses}`} href={`/hub/${type}/`}>
          {type}
        </Link>
        ) : <span className="breadcrumbs__link">{type}</span>}
      </li>
      {title ? (
      <li className="breadcrumbs__item breadcrumbs__item--active">
        <span className="breadcrumbs__link">{title}</span>
      </li> ) : null}
    </ul>
  </nav>
)

const HomeIcon = () => <svg
  viewBox="0 0 24 24"
  className="w-6 h-6 -mb-2 pr-2"
>
  <path d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z" fill="currentColor">
  </path>
</svg>

export const H1 = ({ children, className="" }) => (
  <h1 className="text-4xl lg:text-6xl font-bold my-8">{children}</h1>
)
export const H2 = ({ children }) => (
  <h2 className="text-2xl md:text-3xl font-bold mb-4 mt-8">{children}</h2>
)
export const H3 = ({ children }) => (
  <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>
)
export const H4 = ({ children }) => (
  <h4 className="text-base font-bold mb-0 mt-2">{children}</h4>
)

export const KeyVal = ({ k, val, color = 'primary', small = false, href = false }) => {

  let colorClasses1 = primaryClasses1
  if (color === 'secondary') colorClasses1 = secondaryClasses1
  else if (color === 'neutral') colorClasses1 = neutralClasses1
  else if (color === 'accent') colorClasses1 = accentClasses1
  else if (color === 'info') colorClasses1 = infoClasses1
  else if (color === 'warning') colorClasses1 = warningClasses1
  else if (color === 'success') colorClasses1 = successClasses1
  else if (color === 'error') colorClasses1 = errorClasses1
  let colorClasses2 = primaryClasses2
  if (color === 'secondary') colorClasses2 = secondaryClasses2
  else if (color === 'neutral') colorClasses2 = neutralClasses2
  else if (color === 'accent') colorClasses2 = accentClasses2
  else if (color === 'warning') colorClasses2 = warningClasses2
  else if (color === 'success') colorClasses2 = successClasses2
  else if (color === 'error') colorClasses2 = errorClasses2

  if (href) return <LinkKeyVal {...{ k, val, color, small, href, colorClasses1, colorClasses2 }} />

  return (
    <button className="btn-ghost p-0">
      <span
        className={`${sharedClasses} ${small ? 'rounded-l' : 'rounded-l-lg'} ${colorClasses1} ${small ? 'text-xs' : ''} pr-0.5`}
      >
        {k}
      </span>
      <span
        className={`${sharedClasses} ${small ? 'rounded-r' : 'rounded-r-lg'} ${colorClasses2} ${small ? 'text-xs' : ''} pl-0.5`}
      >
        {val}
      </span>
    </button>
  )
}

/*
 * If we configure the tailwind classes dynamically, they won't be picked up
 * So let's create a component for each color
 */
const sharedClasses = `px-1 text-sm font-medium whitespace-nowrap border-2 border-solid`
const primaryClasses1 = `text-primary-content bg-primary border-primary`
const primaryClasses2 = `text-primary border-primary`
const secondaryClasses1 = `text-secondary-content bg-secondary border-secondary`
const secondaryClasses2 = `text-secondary border-secondary`
const neutralClasses1 = `text-neutral-content bg-neutral border-neutral`
const neutralClasses2 = `text-neutral border-neutral`
const accentClasses1 = `text-accent-content bg-accent border-accent`
const accentClasses2 = `text-accent border-accent`
const infoClasses1 = `text-info-content bg-info border-info`
const infoClasses2 = `text-info border-info`
const warningClasses1 = `text-warning-content bg-warning border-warning`
const warningClasses2 = `text-warning border-warning`
const successClasses1 = `text-warning-content bg-success border-success`
const successClasses2 = `text-success border-success`
const errorClasses1 = `text-error-content bg-error border-error`
const errorClasses2 = `text-error border-error`
