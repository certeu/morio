'use client'
import { useState, useEffect } from 'react'

export const ChartsProvider = ({ type = 'metrics', children }) => {
  const [ready, setReady] = useState(window.morio?.charts?.[type] ? true : false)
  const [error, setError] = useState(false)
  const [injected, setInjected] = useState(0)

  useEffect(() => {
    async function loadCharts() {
      try {
        /*
         * Don't load the charts if they're already in scope
         */
        if (window.morio?.charts?.[type]) return

        /*
         * If we've added the script tag, but they are
         * not loaded yet, give it a second. Then
         * trigger another check.
         */
        if (injected > 0)
          return setTimeout(() => {
            setInjected(injected + 1)
          }, 1000)

        /*
         * Prepare script tag
         */
        const script = document.createElement('script')
        script.src = `/charts/${type}.mjs`
        script.onload = () => setReady(true)
        script.onerror = (err) => setError(err)

        /*
         * Inject script tag into the DOM
         */
        document.body.appendChild(script)
      } catch (err) {
        console.log(err)
        setError(err)
      }
    }
    loadCharts()
  }, [type, injected, children])

  if (error) return <p>We failed to load the charts: {error.toString()}</p>

  return ready ? children : <p>Loading {type} charts...</p>
}
