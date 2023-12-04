import 'ui/styles/globals.css'
import { ModalContextProvider } from 'context/modal.mjs'
import { LoadingStatusContextProvider } from 'context/loading-status.mjs'

export default function App({ Component, pageProps }) {
  return (
    <ModalContextProvider>
      <LoadingStatusContextProvider>
        <Component {...pageProps} />
      </LoadingStatusContextProvider>
    </ModalContextProvider>
  )
}
