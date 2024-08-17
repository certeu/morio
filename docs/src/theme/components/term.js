import React, { useState } from 'react'
import { ModalWrapper } from './modal-wrapper.js'
import jargon from '@site/prebuild/jargon.js'
import terminology from '@site/prebuild/terminology.js'

/*
 * Helper to intersperse an array
 */
const intersperse = (arr, sep) => arr.reduce((a,v)=>[...a,v,sep],[]).slice(0,-1)

/*
 * Lowercase and strip dots, then check if we have a definition for the term
 * If not, return false
 */
const asTerm = (term) => {
  if (typeof term !== 'string') return false
  term = term.toLowerCase().split('.').join('')

  // Check jargon
  if (jargon[term]) return jargon[term]
  // Check terminology
  if (terminology[term]) return terminology[term]

  // Check jargon aliases
  for (const [key, val] of Object.entries(jargon)) {
    if (val.aliases && val.aliases.includes(term)) return val
  }
  // Check terminology aliases
  for (const [key, val] of Object.entries(terminology)) {
    if (val.aliases && val.aliases.includes(term)) return val
  }

  return false
}

/*
 * React component to display the term info inside the modal wrapper
 */
const JargonInfo = ({ term }) => {
  const Content = term.content
  return (
    <div>
      <h2>{term.title}</h2>
      <Content />
    </div>
  )
}

/*
 * This is used for <em> tags.
 * If it's a term, if it wraps a term in our terminology, it will make it clickable.
 * If not, it will merely return the em tag.
 */
export const Term = ({ children }) => {
  const term = asTerm(children)
  const [modal, setModal] = useState(false)

  /*
   * Often, it's just en em tag
   */
  if (term === false) return <em>{children}</em>

  /*
   * Handle a clicked term
   */
  if (modal && term.content) return (
    <ModalWrapper closeHandler={() => setModal(false)}><JargonInfo term={term} /></ModalWrapper>
  )

  /*
   * Jargon has a content prop, whereas terminology does not
   */
  return term.content
    ? (
      <button className="term" onClick={() => setModal(true)}>
        {children}
      </button>
    )
    : <a href={term.url} title={term.title}>{children}</a>
}

export const JargonTerms = () => (
  <table>
    <thead>
      <tr>
        <th>Use As</th>
        <th>Info</th>
      </tr>
    </thead>
    <tbody>
    {Object.keys(jargon).sort().map(term => {
      const Component = jargon[term].content
      const aliases = [
        jargon[term].term ? jargon[term].term : term,
        ...(jargon[term].aliases || [])
      ]

      return (
        <tr key={term}>
          <td style={{ minWidth: "12ch" }}>
            {intersperse(aliases, 'or')
              .map((alias, i) => alias === 'or'
                ? <b key={i}> or </b>
                : <span key={i}>_{alias}_</span>
              )
            }</td>
          <td><h6>{jargon[term].title}</h6><div style={{fontSize: '85%'}}><Component /></div></td>
        </tr>
      )}
    )}
    </tbody>
  </table>
)

export const JargonList = () => (
  <>
  {Object.keys(jargon).sort().map(term => {
    const Component = jargon[term].content
    const aliases = [
      jargon[term].term ? jargon[term].term : term,
    , ...(jargon[term].aliases || [])
    ]

    return (
      <div key="term">
        <h2 id={term} className="anchor anchorWithStickyNavbar_---node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module">
          <div style={{opacity: "0.5", fontSize: "65%"}}>
            Use as:
          {intersperse(aliases, 'or')
            .map(alias => alias === 'or'
              ? <b> or </b>
              : <code style={{padding: '0 0.25rem', fontWeight: 'normal'}} key={alias}>_{alias}_</code>
            )
          }
          </div>
          {jargon[term].title}
          <a
            href={`#${term.split(' ').join('-')}`}
            class="hash-link"
            ariaLabel={`Direct link to ${jargon[term].title}`}
            title={`Direct link to ${jargon[term].title}`}
          > </a>
        </h2>
        <div><Component /></div>
      </div>
    )}
  )}
</>
)

export const TerminologyTerms = () => (
  <table>
    <thead>
      <tr>
        <th>Use as</th>
        <th>Links to</th>
      </tr>
    </thead>
    <tbody>
    {Object.keys(terminology).map(term => {
      const aliases = [
        terminology[term].term ? terminology[term].term : term,
      , ...(terminology[term].aliases || [])
      ]

      return (
        <tr key="term">
          <td style={{ minWidth: "12ch" }}>
            {intersperse(aliases, 'or')
              .map((alias, i) => alias === 'or'
                ? <b key={i}> or </b>
                : <span key={i}>_{alias}_</span>
              )
            }
          </td>
          <td><a href={terminology[term].url}>{terminology[term].url}</a></td>
        </tr>
      )}
    )}
    </tbody>
  </table>
)
