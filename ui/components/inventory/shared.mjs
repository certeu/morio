import { ResetIcon } from 'components/icons.mjs'

export const ReloadDataButton = ({ onClick }) => (
  <p className="text-right">
    <button className="btn btn-ghost opacity-40 hover:opacity-100" onClick={onClick}>
      <ResetIcon className="w-4 h-4" stroke={3}/>
      <span className="pl-1">Reload Data</span>
    </button>
  </p>
)

