import React, { Fragment } from 'react'
import Markdown from 'react-markdown'

export const MdxWrapper = ({ children }) => (
  <div className="mdx">
    {children.map((el, i) => {
      if (typeof el === 'string') return <Markdown id={i}>{el}</Markdown>
      if (React.isValidElement(el)) return <Fragment id={i}>{el}</Fragment>
      if (typeof el === 'object') return <pre id={i}>{JSON.stringify(el, null, 2)}</pre>
    })}
  </div>
)
