/*
 * A button to show/toggle whether a view is live or not
 */
export const ToggleLiveButton = ({ paused, setPaused }) => (
  <button
    className={`btn btn-xs border-2 btn-outline`}
    onClick={() => setPaused(!paused)}
  >
    <span className="relative flex h-3 w-3">
      {paused ? null : <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${paused ? 'bg-neutral opacity-50' : 'bg-error'}`}></span>
    </span>
    {paused ? 'Paused' : 'Live'}
  </button>
)

export const ToggleGraphButton = ({ graph, setGraph }) => (
  <button
    className="btn btn-primary btn-xs btn-outline border-2"
    onClick={() => setGraph(!graph)}
  >
    Show {graph ? 'data' : 'graph'}
  </button>
)
