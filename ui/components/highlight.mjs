import { CopyToClipboard } from 'components/copy-to-clipboard.mjs'

const names = {
  js: 'Javascript',
  bash: 'Bash prompt',
  sh: 'Shell prompt',
  json: 'JSON',
  yaml: 'YAML',
}

export const Highlight = (props) => {
  let language = 'txt'
  let status = false
  if (props.language) language = props.language
  if (props.children?.props?.className) {
    language = props.children.props.className.split('-').pop()
    if (language.indexOf('.') !== -1) {
      ;[status, language] = language.split('.')
    }
  }

  const preProps = {
    className: `language-${language} hljs text-base lg:text-lg whitespace-break-spaces overflow-auto px-4 py-2`,
  }
  if (props.raw) preProps.dangerouslySetInnerHTML = { __html: props.raw }

  const content = props.js ? JSON.stringify(props.js, null, 2) : props.children

  return (
    <div className="hljs my-4 bg-neutral rounded-lg py-1 text-neutral-content">
      <div
        className={`
        flex flex-row justify-between items-center
        text-xs font-medium text-warning
        mt-1 border-b border-neutral-content border-opacity-25
        px-4 py-1 mb-2 lg:text-sm
      `}
      >
        <span>{names[language] ? names[language] : language}</span>
        <CopyToClipboard content={content} />
      </div>
      <pre {...preProps}>{content}</pre>
    </div>
  )
}
