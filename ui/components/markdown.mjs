import MarkdownHandler from 'react-markdown'

export const Markdown = ({ children, className = 'mdx' }) => (
  <div className={className}>
    <MarkdownHandler>{children}</MarkdownHandler>
  </div>
)
