import { TipIcon, WarningIcon } from './icons.mjs'

/**
 * A component to display a mini tip
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini tip
 * @returns {JSX.Element}
 */
export const MiniTip = ({ children }) => (
  <div className="flex flex-row border border-success rounded">
    <div className="bg-success text-success-content p-1 rounded-l flex flex-row items-center">
      <TipIcon className="w-6 h-6 text-success-content" />
    </div>
    <div className="p-1 px-2 text-sm font-medium bg-success/10 grow rounded-r mini">{children}</div>
  </div>
)

/**
 * A component to display a mini warning
 *
 * @component
 * @param {object} props - All component props
 * @param {JSX.Element} props.children - The component children, will be rendered inside the mini warning
 * @returns {JSX.Element}
 */
export const MiniWarning = ({ children }) => (
  <div className="flex flex-row border border-warning rounded">
    <div className="bg-warning text-warning-content p-1 rounded-l flex flex-row items-center">
      <WarningIcon className="w-6 h-6 text-warning-content" />
    </div>
    <div className="p-1 px-2 text-sm font-medium bg-warning/10 grow rounded-r mini">{children}</div>
  </div>
)
