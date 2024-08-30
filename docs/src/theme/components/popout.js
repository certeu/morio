import {
  CommentIcon,
  ErrorIcon,
  FixmeIcon,
  GitHubIcon,
  ImportantIcon,
  InfoIcon,
  TipIcon,
  WarningIcon,
} from './icons.js'

const icons = {
  comment: <CommentIcon />,
  error: <ErrorIcon />,
  fixme: <FixmeIcon />,
  important: <ImportantIcon />,
  note: <InfoIcon />,
  scode: <GitHubIcon />,
  tip: <TipIcon />,
  warning: <WarningIcon />,
}

/*
 * Base component
 */
export const Popout = (props) => {
  const { type } = props

  if (type === 'comment' && typeof props.by !== 'string') return <CommentMissesBy {...props} />

  return (
    <div className={`popout mdx-${type} popout-regular`}>
      <div className={`popout-inner ${props.compact ? 'compact' : ''}`}>
        <div className="popout-title">
          <span className="type">
            {props.title ? props.title : type === 'scode' ? 'Source Code' : type.toUpperCase()}
            {['comment', 'fixme'].includes(type) && props.by && (
              <span className="by-lead">
                by <b>{props.by}</b>
              </span>
            )}
          </span>
          {props.compact || typeof icons[type] === 'undefined' ? null : icons[type]}
        </div>
        {props.compact ? <span className="type">&nbsp;|&nbsp;</span> : null}
        <div className="popout-content">{props.children}</div>
        {props.compact && typeof icons[type] !== 'undefined' ? icons[type] : null}
      </div>
    </div>
  )
}

/*
 * Don't allow comments without the by prop
 */
const CommentMissesBy = (props) => (
  <Popout type="error">
    <p>
      When using a <code>Comment</code> custom component, please provide the <code>by</code> prop.
    </p>
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
export const Scode = (props) => <Popout type="scode" {...props} />
export const Tip = (props) => <Popout type="tip" {...props} />
export const Warning = (props) => <Popout type="warning" {...props} />
