import { ResetIcon } from 'components/icons.mjs'
import { CountdownCircle } from 'components/animations.mjs'

export const ReloadDataButton = ({ onClick, animate=false }) => (
  <p className="text-right">
    <button className="btn btn-ghost opacity-40 hover:opacity-100" onClick={onClick}>
      {animate
        ? <CountdownCircle duration={animate} className="w-5 h-5" stroke={2.5}/>
        : <ResetIcon className="w-4 h-4" stroke={3}/>
      }
      <span className="pl-1">Reload Data</span>
    </button>
  </p>
)

