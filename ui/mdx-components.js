import { Popout } from 'components/popout.mjs'
import { Term } from 'components/term.mjs'
import { LearnMore } from 'components/learn-more.mjs'

export function useMDXComponents(components) {
  return {
    Comment: (props) => <Popout {...props} comment />,
    Error: (props) => <Popout {...props} error />,
    Fixme: (props) => <Popout {...props} fixme />,
    Important: (props) => <Popout {...props} important />,
    Link: (props) => <Popout {...props} link />,
    Popout: (props) => <Popout {...props} neutral />,
    Note: (props) => <Popout {...props} note />,
    Related: (props) => <Popout {...props} related />,
    Tip: (props) => <Popout {...props} tip />,
    Tldr: (props) => <Popout {...props} tldr />,
    Warning: (props) => <Popout {...props} warning />,
    em: (props) => <Term {...props} />,
    LearnMore: (props) => <LearnMore {...props} />,
    ...components,
  }
}
