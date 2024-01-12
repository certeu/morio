import { useState, useEffect } from 'react'

const Setup = () => (
  <PageWrapper {...props} layout={Layout} header={false} footer={false}>
    <div className="">
      <div className="flex flex-col justify-center h-screen pb-24 mx-auto max-w-xl">
        <h1 className="flex flex-row gap-2 items-center justify-between">
          <MorioIcon className="w-12 h-12 text-primary" />
          <div className="text-4xl text-center">Welcome to Morio</div>
          <button onClick={toggleTheme} title="Switch between dark and light mode">
            {theme === 'dark' ? (
              <LightThemeIcon className="w-12 h-12 text-accent" />
            ) : (
              <DarkThemeIcon className="w-12 h-12 text-warning" />
            )}
          </button>
        </h1>
        <div className="grid gap-2 mb-4 mt-4">
          <Link className="btn btn-primary btn-lg" href="/setup/wizard">
            Use the configuration wizard
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link className="btn btn-primary btn-outline" href="/setup/upload">
            Upload a configuration file
          </Link>
          <Link className="btn btn-primary btn-outline" href="/setup/download">
            Download a configuration file
          </Link>
        </div>
        <Popout important>
          <h5>Morio needs a configuration</h5>
          <span className="text-sm">
            Use the configuration wizard, or provide a configuration file to get started.
          </span>
        </Popout>
        <p className="text-center mt-4 opacity-50 text-sm">
          <a
            href="https://cert.europa.eu/"
            className="text-base-content hover:text-primary"
            title="To the CERT-EU website"
          >
            <b>MORIO</b>
            <span className="px-2">by</span>
            <b>CERT-EU</b>
          </a>
        </p>
      </div>
    </div>
  </PageWrapper>
)


export const GuardSetup = ({ children }) => {

  const [config, setConfig] = useState(false)

  useEffect(() => {
    const loadConfig = async () => {

    }
  },[])

  return children
}
