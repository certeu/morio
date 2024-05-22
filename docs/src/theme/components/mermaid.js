import BaseMermaid from '@theme/Mermaid'
import { useState } from 'react'
import { Popout } from './popout.js'

/*
 * Wrapper component to generate a Mermaid diagram.
 *
 * This injects node styles, and adds a button to show a legend.
 */
export const Mermaid = ({ children, caption=false }) => {
  const [showLegend, setShowLegend] = useState(false)

  return (
    <>
    <div className="with-caption">
      <div className="shadow">
        <BaseMermaid value={withStyles(children)} />
        {showLegend ? <div style={{padding: '0.5rem'}}><Legend /></div> : null}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        {caption && <p className="caption">{caption}</p>}
        <a role="button" className="toggle" onClick={() => setShowLegend(!showLegend)}>{showLegend ? 'Hide' : 'Show'} legend</a>
      </div>
    </div>
    </>
  )
}

/*
 * The legend for the node styles
 */
const Legend = () => (
  <Popout type="note">
    <p style={{marginBottom: '1rem'}}>This diagram uses the following conventions:</p>
    <ul>
      <li>A <span style={{background: '#23b1d3', border: '2px solid #333', color: '#000', borderRadius: '0.2rem', padding: '0.2rem'}}>blue-ish</span> box indicates a Morio service that <b>is available</b> in [ephemeral state](/docs/reference/terminology/ephemeral-state/).</li>
      <li>A <span style={{background: '#09bc8a', border: '2px solid #333', color: '#000', borderRadius: '0.2rem', padding: '0.2rem'}}>green</span> box indicates a Morio service that <b>is not available</b> in [ephemeral state](/docs/reference/terminology/ephemeral-state/).</li>
      <li>A <span style={{background: '#fb8500', border: '2px solid #333', color: '#000', borderRadius: '0.2rem', padding: '0.2rem'}}>amber</span> box indicates a Morio service that is <b>started on-demand</b>.</li>
      <li>A <b><code>Morio </code></b>-prefix in the service name/box indicates the service is specific to Morio, rather than a bundled dependency (in other words, this is what we wrote ourselves, the rest we borrowed).</li>
    </ul>
  </Popout>
)

/*
 * Helper method to grab the Mermaid code and inject the styles
 */
const withStyles = (children) => {
  const code = typeof children.props.children === 'string'
    ? children.props.children
    : children.props.children.props.children
  const lines = code.split("\n")

  return [
    lines[0],
    mermaidStyles,
    ...lines.slice(1)
  ].join("\n")
}

/*
 * Mermaid styles for Morio achitecture diagrams
 */
const mermaidStyles = `
  classDef blue fill:#23b1d3,stroke:#333,stroke-width:2px,color:#000;
  classDef green fill:#09BC8A,stroke:#333,stroke-width:2px,color:#000;
  classDef orange fill:#fb8500,stroke:#333,stroke-width:2px,color:#000,stroke-dasharray: 5 5;
`

