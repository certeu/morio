import { HttpErrorWrapper } from 'components/layout/http-error-wrapper.mjs'

export default function  ErrorPage({ params }) { return <HttpErrorWrapper error={params.error} /> }

export const getStaticProps = ({ params }) => ({ props: { params } })

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
})

