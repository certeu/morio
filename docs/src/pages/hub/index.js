import React, { useState, useEffect } from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import { moriohub as hub } from '@site/prebuild/moriohub.mjs'
import Fuse from 'fuse.js'
import { H2 } from '@site/src/components/moriohub/entry.js'

const Agent = ({ children }) => (
  <div className="badge badge-accent font-medium uppercase text-xs">{children}</div>
)

export const H1 = ({ children, className="" }) => (
  <h1 className="text-4xl lg:text-6xl font-bold my-8 text-center">{children}</h1>
)

const Search = () => {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState([])
  const [fuse, setFuse] = useState(null)

  /*
   * Initialize our Fuse instance
   */
  useEffect(() => {
    setFuse(new Fuse(transformData(), {
      keys: ['name', 'info'],
      threshold: 0.4,
      includeMatches: true
    }))
  }, [hub])

  /*
   * Handle search
   */
  useEffect(() => {
    if (!fuse || !q) {
      setHits([])
      return
    }
    const results = fuse.search(q)
    setHits(results)
  }, [q, fuse])

  return (
    <div>
      <div className="form-control w-full mt-2 max-w-2xl mx-auto">
        <input
          id="search"
          type="text"
          placeholder="Type here to search Moriohub"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input w-full input-bordered input-primary"
        />
      </div>
      {hits.length > 0
        ? <SearchResults hits={hits} q={q} /> :
        <ShowAll />
      }
    </div>
  )
}

const SearchResults = ({ hits, q }) => (
  <div className="mt-6">
    <Grid>

      {hits.map(hit => {
        if (hit.item.category === 'modules') return <Module id={hit.item.name} q={q} key={hit.item.name}/>
        if (hit.item.category === 'overlays') return <Overlay id={hit.item.name} q={q} key={hit.item.name}/>
        if (hit.item.category === 'processors') return <Processor id={hit.item.name} q={q} key={hit.item.name}/>

        return null
      })}
    </Grid>
  </div>
)


const Grid = ({ children }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-2">
    {children}
  </div>
)

export const Modules = () => (
  <Grid>
    {Object.keys(hub.modules).sort().map(id => <Module id={id} key={id} />)}
  </Grid>
)
export const Overlays = () => (
  <Grid>
    {Object.keys(hub.overlays).sort().map(id => <Overlay id={id} key={id} />)}
  </Grid>
)
export const Processors = () => (
  <Grid>
    {Object.keys(hub.processors).sort().map(id => <Processor id={id} key={id} />)}
  </Grid>
)

const boxClasses = "px-4 py-2 rounded-lg border md:border-2 shadow border"

const Module = ({ id }) => hub.modules[id] ? (
  <Link
    className={`${boxClasses} border-accent hover:bg-accent/20`}
    href={`/hub/modules/${id}/`}
  >
    <h4 className="font-bold text-lg">{id}</h4>
    <ul className="flex flex-row flex-wrap gap-1 items-center">
      {Object.keys(hub.modules[id]).sort().map(agent => <li key={agent}><Agent>{agent}</Agent></li>)}
    </ul>
  </Link>
) : <p>No such module: {id}</p>

const Overlay = ({ id }) => (
  <Link
    className={`${boxClasses} border-primary hover:bg-primary/20`}
    href={`/hub/overlays/${id}/`}
  >
    <h4 className="font-bold text-lg">{id}</h4>
    <p className="text-sm leading-5">{hub.overlays[id].moriodata.info}</p>
  </Link>
)

const Processor = ({ id }) => (
  <Link
    className={`${boxClasses} border-secondary hover:bg-secondary/20`}
    href={`/hub/processors/${id}/`}
  >
    <h4 className="font-bold text-lg">{id}</h4>
    <p className="text-sm leading-5">{hub.processors[id].moriodata.info}</p>
    {hub.processors[id].modules
      ? <div className="badge bg-yellow-500 text-yellow-900 font-medium uppercase text-xs">modular</div>
      : null
    }
  </Link>
)


const ShowAll = () => (
  <>
    <H2>Morio Client Modules <small className="opacity-70">({Object.keys(hub.modules).length})</small></H2>
    <Modules />
    <H2>Morio Settings Overlays <small className="opacity-70">({Object.keys(hub.overlays).length})</small></H2>
    <Overlays />
    <H2>Morio Stream Processors <small className="opacity-70">({Object.keys(hub.processors).length})</small></H2>
    <Processors />
  </>
)

export default function Moriohub() {
  return (
    <Layout
      title={`MorioHub`}
      description="Morio provides the plumbing for your observability needs"
    >
      <div className="tailwind">
        <div className="max-w-5xl mx-auto mb-12 px-4">
          <H1>MorioHub</H1>
          <Search />
        </div>
      </div>
    </Layout>
  )
}

/*
 * Transforms moriohub data into a flat array for searching with fuse.js
 */
function transformData() {
  const items = []

  /*
   * Iterate over modules, overlays, and processors
   */
  Object.entries(hub).forEach(([category, categoryData]) => {
    /*
     * Add main items
     */
    Object.entries(categoryData).forEach(([key, value]) => {
      items.push({
        category,
        type: value.type,
        name: value.name || key,
        info: value.moriodata?.info || '',
        path: `${category}/${key}`
      })

      /*
       * Add any modules if they exist
       */
      if (value.modules) {
        Object.entries(value.modules).forEach(([moduleKey, moduleValue]) => {
          items.push({
            category: `${category}/${key}/modules`,
            type: moduleValue.type,
            name: moduleValue.name || moduleKey,
            info: moduleValue.moriodata?.info || '',
            path: `${category}/${key}/modules/${moduleKey}`
          })
        })
      }
    })
  })

  return items
}

