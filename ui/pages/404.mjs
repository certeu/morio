import { HttpErrorWrapper } from 'components/layout/http-error-wrapper.mjs'

export default function ErrorPage() {
  return <HttpErrorWrapper error={404} />
}
