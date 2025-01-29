'use client'
import { useState, useEffect } from 'react'

export const TransformerProvider = ({ type='metrics', children }) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function loadTransformers() {
      try {
        /*
         * Don't load the transformers twice
         */
        if (window.morio?.transformers?.[type]) return

        /*
         * Prepare script tag into the DOM
         */
        const script = document.createElement('script');
        script.src = `/transformers/${type}.mjs`;
        script.onload = () => setReady(true)
        script.onerror = () => console.log(`Failed to load transformer: ${transformerName}`)

        /*
         * Inject script tag into the DOM
         */
        document.body.appendChild(script)
      } catch (err) {
        console.log(`Error: ${err.message}`)
      }
    }

    loadTransformers()
  }, [type])

  return ready
    ? children
    : <p>Loading {type} transformers...</p>
}
