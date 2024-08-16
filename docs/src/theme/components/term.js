import React, { useState } from 'react'
import { ModalWrapper } from './modal-wrapper.js'
import { jargon, terminology } from '@site/terminology.mjs'

/*
 * Lowercase and strip dots, then check if we have a definition for the term
 * If not, return false
 */
const asTerm = (term) => {
  if (typeof term !== 'string') return false
  term = term.toLowerCase().split('.').join('')

  return jargon[term] ? jargon[term] : terminology[term] ? terminology[term] : false
}

/*
 * React component to display the term info inside the modal wrapper
 */
const JargonInfo = ({ term }) => {

  return (
    <div>
      <h2>{term.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: term.content }} />
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

  if (modal && term.content) return (
    <ModalWrapper closeHandler={() => setModal(false)}><JargonInfo term={term} /></ModalWrapper>
  )

  /*
   * Often, it's just en em tag
   */
  if (term === false) return <em>{children}</em>

  /*
   * Jargon has a content prop, whereas terminology does not
   */
  return term.content
    ? (
      <button className="term" onClick={() => setModal(true)}>
        {children}
      </button>
    )
    : <a href={term.url}>{term.title}</a>
}

export const JargonTerms = () => (
  <table>
    <thead>
      <tr>
        <th>Term</th>
        <th>Title</th>
        <th>Content</th>
      </tr>
    </thead>
    <tbody>
    {Object.keys(jargon).sort().map(term => (
      <tr key="term">
        <td style={{ minWidth: "12ch" }}>{term}</td>
        <td>{jargon[term].title}</td>
        <td dangerouslySetInnerHTML={{ __html: jargon[term].content }} style={{maxWidth: "66ch"}}/>
      </tr>)
    )}
    </tbody>
  </table>
)

export const JargonList = () => (
  <>
  {Object.keys(jargon).sort().map(term => (
    <div key="term">
      <h2 id={term} className="anchor anchorWithStickyNavbar_---node_modules-@docusaurus-theme-classic-lib-theme-Heading-styles-module">
        <span style={{opacity: "0.5", fontSize: "75%"}}>{term}</span><br />{jargon[term].title}
        <a
          href={`#${term.split(' ').join('-')}`}
          class="hash-link"
          ariaLabel={`Direct link to ${jargon[term].title}`}
          title={`Direct link to ${jargon[term].title}`}
        > </a>
      </h2>
      <div dangerouslySetInnerHTML={{ __html: jargon[term].content }} />
    </div>)
  )}
</>
)

export const TerminologyTerms = () => (
  <table>
    <thead>
      <tr>
        <th>Term</th>
        <th>Title</th>
        <th>URL</th>
      </tr>
    </thead>
    <tbody>
    {Object.keys(terminology).map(term => (
      <tr key="term">
        <td style={{ minWidth: "12ch" }}>{term}</td>
        <td>{terminology[term].title}</td>
        <td><a href={terminology[term].url}>{terminology[term].url}</a></td>
      </tr>)
    )}
    </tbody>
  </table>
)
