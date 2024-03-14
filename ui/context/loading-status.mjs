import { useState, useEffect, createContext } from 'react'
import { Spinner } from 'components/animations.mjs'
import { OkIcon, WarningIcon } from 'components/icons.mjs'

/*
 * Create the React context
 */
export const LoadingStatusContext = createContext([false])

/*
 * Timeout in seconds before the loading status dissapears
 */
const timeout = 2

/*
 * A React component to display the loading status
 *
 * You call it with an array with the folllowing elements:
 * 0: set to true to display loading status
 * 1: The message to display
 * 2: Set to true to let the loading status auto-fade
 * 3: Set to true for success, false for error.
 *
 * Example: setLoadingStatus([true, 'It worked', true, true])
 */
const LoadingStatus = ({ loadingStatus }) => {
  const [fade, setFade] = useState('opacity-100')
  const [timer, setTimer] = useState(false)

  useEffect(() => {
    if (loadingStatus[2]) {
      if (timer) clearTimeout(timer)
      setTimer(
        window.setTimeout(
          () => {
            setFade('opacity-0')
          },
          timeout * 1000 - 350
        )
      )
    }
  }, [loadingStatus[2]])

  if (!loadingStatus[0]) return null

  let color = 'accent'
  let icon = <Spinner />
  if (loadingStatus[2]) {
    color = loadingStatus[3] ? 'success' : 'error'
    icon = loadingStatus[3] ? (
      <OkIcon stroke={4} className="w-8 h-8" />
    ) : (
      <WarningIcon className="w-8 h-8" stroke={2} />
    )
  }

  return (
    <div className="fixed bottom-0 md:bottom-4 left-0 w-full z-50 md:px-4 md:mx-auto">
      <div
        className={`w-full md:max-w-2xl m-auto bg-${color} flex flex-row items-center gap-4 p-4 px-4 ${fade}
        transition-opacity delay-[${timeout * 1000 - 400}ms] duration-300 text-${color}-content
        md:rounded-lg shadow text-lg lg:text-xl font-medium md:bg-opacity-90`}
      >
        <span className="shrink-0">{icon}</span>
        {loadingStatus[1]}
      </div>
    </div>
  )
}

/*
 * A React component to display a loading status progress bar
 */
const LoadingProgress = ({ val = 0, max = 1, msg }) => (
  <div className="flex flex-col gap-2 w-full grow-0">
    {msg}
    <progress className="progress progress-white" value={val} max={max}></progress>
  </div>
)

/*
 * The React LoadingStatus context provider
 */
export const LoadingStatusContextProvider = ({ children }) => {
  /*
   * LoadingStatus should hold an array with 1 to 4 elements:
   * 0 => Show loading status or not (true or false)
   * 1 => Message to show
   * 2 => Set this to true to make the loadingStatus dissapear after 2 seconds
   * 3 => Set this to true to show success, false to show error (only when 2 is true)
   */
  const [timer, setTimer] = useState(false)

  const [__loadingStatus, __setLoadingStatus] = useState({
    status: [false],
    setLoadingStatus,
    loading: false,
    LoadingStatus: () => <LoadingStatus loadingStatus={[false]} />,
    LoadingProgress,
  })

  useEffect(() => {
    if (__loadingStatus.status[2]) {
      if (timer) clearTimeout(timer)
      setTimer(
        window.setTimeout(() => {
          setLoadingStatus([false])
        }, timeout * 1000)
      )
    }
  }, [__loadingStatus.status[2]])

  function setLoadingStatus(newStatus) {
    __setLoadingStatus({
      ...__loadingStatus,
      status: newStatus,
      loading: newStatus[0] || false,
      LoadingStatus: () => <LoadingStatus loadingStatus={newStatus} />,
    })
  }

  return (
    <LoadingStatusContext.Provider value={__loadingStatus}>
      {children}
    </LoadingStatusContext.Provider>
  )
}
