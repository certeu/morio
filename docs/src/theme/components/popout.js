import {
  CommentIcon,
  ErrorIcon,
  FixmeIcon,
  GitHubIcon,
  ImportantIcon,
  NoteIcon,
  RelatedIcon,
  TipIcon,
  TldrIcon,
  WarningIcon,
} from './icons.js'


const icons = {
  comment: <CommentIcon />,
  error: <ErrorIcon />,
  fixme: <FixmeIcon />,
  important: <ImportantIcon />,
  note: <NoteIcon />,
  related: <RelatedIcon />,
  scode: <GitHubIcon />,
  tip: <TipIcon />,
  tldr: <TldrIcon />,
  warning: <WarningIcon />,
}

/*
 * Base components
 */
export const Popout = (props) => {
  const { type } = props

  if (type === 'comment' && typeof props.by !== 'string') return <CommentMissesBy {...props} />

  return (
    <div className={`popout mdx-${type} popout-regular`}>
      <div className="popout-inner">
        <div className="popout-title">
          <span className="type">
            {type === 'tldr' ? 'TL;DR' : type === 'scode' ? 'Source Code' : type}
            {type === 'comment' && props.by && (
              <><span className="by-lead">by {props.by}</span>
              </>
            )}
          </span>
          {typeof icons[type] === 'undefined' ? null : icons[type]}
        </div>
        <div className="popout-content">{props.children}</div>
        {type === 'comment' && <span className="by-name">{props.by}</span>}
      </div>
    </div>
  )
}

/*
 * Don't allow comments without the by prop
 */
const CommentMissesBy = (props) => (
  <Popout type="error">
    <p>When using a <code>Comment</code> custom component, please provide the <code>by</code> prop.</p>
    <p>Original comment:</p>
    <pre>{props.children}</pre>
  </Popout>
)

/*
 * MDX Variants
 */
export const Comment = (props) => <Popout type="comment" {...props} />
export const Error = (props) => <Popout type="error" {...props} />
export const Fixme = (props) => <Popout type="fixme" {...props} />
export const Important = (props) => <Popout type="important" {...props} />
export const Note = (props) => <Popout type="note" {...props} />
export const Related = (props) => <Popout type="related" {...props} />
export const Scode = (props) => <Popout type="scode" {...props} />
export const Tip = (props) => <Popout type="tip" {...props} />
export const Tldr = (props) => <Popout type="tldr" {...props} />
export const Warning = (props) => <Popout type="warning" {...props} />

