import MarkdownHandler from 'react-markdown'

export const Markdown = ({ children }) => (
  <div className="mdx">
    <MarkdownHandler>{children}</MarkdownHandler>
  </div>
)
