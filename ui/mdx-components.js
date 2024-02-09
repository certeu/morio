import { Popout } from 'components/popout.mjs'
import { ReadMore } from 'components/read-more.mjs'

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
    //ReadMore: props => <ReadMore {...props} />,
    Tip: (props) => <Popout {...props} tip />,
    Tldr: (props) => <Popout {...props} tldr />,
    Warning: (props) => <Popout {...props} warning />,
    ...components,
  }
}
