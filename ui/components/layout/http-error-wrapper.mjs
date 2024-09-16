// Components
import Head from 'next/head'
import { MorioWordmark } from '../branding.mjs'
// Errors from https://status.js.org/codes.json
import errors from './http-error-codes.json'  with { type: 'json' }



/*
 * This React component renders a pretty error page for HTTP errors
 * It is used by Traefik middleware when an error happens.
 */
export const HttpErrorWrapper = ({ error=404 }) => (
  <div className="min-h-[100vh] w-full m-auto p-0" style={{
    backgroundImage: `url(/error-bg.svg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center inherit',
  }}>
    <Head>
      <title>{`${error}: ${errors[error].message}`}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.svg" />
    </Head>
    <div className="grid grid-cols-2 gap-2">
      <div className="bg-black bg-opacity-80 mx-auto w-full text-neutral-content">
        <div className="flex flex-col p-4 h-screen mx-auto items-end justify-between text-neutral-content px-12">
          <span></span>
          <div className="max-w-sm">
            <h1 className="text-7xl bold text-neutral-content text-right block" style={{
              fontSize: '6.66rem'
            }}>{error}</h1>
            <h2 className="text-neutral-content text-right block">{errors[error].message}</h2>
            <p className="text-neutral-content text-right block">{errors[error].description}</p>
          </div>
          <a href="/" className="text-neutral-content hover:text-accent"><MorioWordmark /></a>
        </div>
      </div>
      <div className="h-screen flex flex-col justify-end p-2" style={{
        ackgroundImage: `url(/error-bg.svg)`,
        ackgroundSize: 'cover',
        ackgroundPosition: 'center inherit',
      }}>
          <span className="text-xs block w-full text-right" >Background image from <a
            className="text-base-content underline"
            href="https://www.freevector.com/fantasy-world-game-background-95208"
            target="_BLANK"
            rel="nofollow">freevector.com</a></span>
      </div>
    </div>
  </div>
)
