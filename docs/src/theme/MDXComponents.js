import React from 'react'
import MDXComponents from '@theme-original/MDXComponents'
// Custom Morio scope
import { SubPages } from './components/subpages.js'
import {
  Comment,
  Error,
  Important,
  Fixme,
  Note,
  Related,
  Tip,
  Tldr,
  Warning,
} from './components/popout.js'

/*
 * This seems to simple to put in a file on its own
 */
const WithCaption = ({ children, caption }) => (
  <div className="with-caption">
    <div className="shadow">{children}</div>
    <p className="caption">{caption}</p>
  </div>
)

export default {
  ...MDXComponents,
  // Custom Morio scope
  WithCaption,
  Comment,
  Error,
  Important,
  Fixme,
  Note,
  Related,
  Tip,
  Tldr,
  Warning,
  SubPages,
}
