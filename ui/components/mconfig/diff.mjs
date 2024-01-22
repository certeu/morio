import { diffWords, diffJson } from 'diff'
import diffViewerModule from 'react-diff-viewer-continued'
// See: https://github.com/Aeolun/react-diff-viewer-continued/issues/40
const ReactDiffViewer = diffViewerModule.default
const DiffMethod = diffViewerModule.DiffMethod

export const diffJSON = (from, to) => diffJson(from, to)
export const diffCheck = (from, to) => diffWords(from, to)

const newStyles = {
  variables: {
    light: {
      codeFoldGutterBackground: '#6F767E',
      codeFoldBackground: '#E2E4E5',
    },
  },
}

export const DiffViewer = ({
  from = '',
  to = '',
  json = false,
  yaml = false,
  fromTitle = 'Old Version',
  toTitle = 'New Version',
}) => (
  <ReactDiffViewer
    oldValue={from}
    newValue={to}
    splitView={true}
    compareMethod={DiffMethod.WORDS}
    styles={newStyles}
    leftTitle={fromTitle}
    rightTitle={toTitle}
    // renderContent={highlightSyntax}
  />
)
