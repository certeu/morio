import BaseMermaid from '@theme/Mermaid'
import { useState } from 'react'
import { Popout } from './popout.js'
import Link from '@docusaurus/Link'

/*
 * Wrapper component to generate a Mermaid architecture diagram.
 *
 * This injects node styles, and adds a button to show a legend.
 */
export const Architecture = ({ children, caption=false }) => {
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
 * Little helper to prevent repeating ourselves
 */
const Span = ({ bg, children }) => <span style={{
  background: bg,
    border: '2px solid #333',
    color: '#000',
    borderRadius: '0.2rem',
    padding: '0.2rem'
  }}>{children}</span>

/*
 * More DRY-ness
 */
const Eph = () => <Link href="/docs/reference/terminology/ephemeral-state/">ephemeral state</Link>

/*
 * The legend for the node styles
 */
const Legend = () => (
  <Popout type="note">
    <p style={{marginBottom: '1rem'}}>This diagram uses the following conventions:</p>
    <ul>
      <li>A <Span bg="#23b1d3">blue-ish</Span> box indicates a Morio service that <b>is available</b> in <Eph />.</li>
      <li>A <Span bg="#09bc8a">green</Span> box indicates a Morio service that <b>is not available</b> in <Eph />.</li>
      <li>A <Span bg="#fb8500">amber</Span> box indicates a Morio service that is <b>started on-demand</b>.</li>
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

