// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext, useEffect } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PlusIcon, TrashIcon } from 'components/icons.mjs'
import { StringInput, TextInput } from 'components/inputs.mjs'
import { Debian } from 'components/brands.mjs'
import { Popout } from 'components/popout.mjs'
import { Tab, Tabs } from 'components/tabs.mjs'
import { PageLink } from 'components/link.mjs'

const Docs = ({ field }) => (
  <a
    href={`https://www.debian.org/doc/debian-policy/ch-controlfields.html#${
      altDocsFields[field] ? altDocsFields[field] : field
    }`}
    target="_BLANK"
    rel="nofollow"
  >
    Debian docs
  </a>
)

const fields = {
  basics: {
    Package: 'The name to use for the package',
    'Changed-By': 'The person who created this build of the package',
    Version: 'The version number of the package',
    Revision: 'The revision number of the package',
  },
  advanced: {
    Section: 'The Debian section the package belongs to',
    Priority: 'The Debian priority code for this package',
    Architecture: 'The Debian architecture code for the package',
    Essential: 'Setting this to yes means the package cannot be removed',
    'Installed-Size': 'Estimate of the disk space reuired (in MB)',
    Maintainer: `The person or entity who maintains this package`,
    Homepage: 'Link to the homepage for the package',
    Description: 'A one-liner short description',
    'Vcs-Git': 'Git repository info',
  },
}
const altDocsFields = {
  'vcs-git': 'version-control-system-vcs-fields',
  revision: 'version',
}

/*
  Depends: {
    auditbeat: '>= 8.12',
    filebeat: '>= 8.12',
    metricbeat: '>= 8.12',
  },
  Uploaders: [ 'Joost De Cock <joost.decock@cert.europa.eu>' ],
  extended desc
*/

/**
 * The actual component, in case we want to extract it for re-use later
 */
const CreatePackage = () => {
  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  /*
   * State
   */
  const [result, setResult] = useState(false)
  const [data, setData] = useState(false)
  const [defaults, setDefaults] = useState(false)
  const [refresh, setRefresh] = useState(0)

  /*
   * We'll need the API
   */
  const { api } = useApi()

  /*
   * Helper method to clear the fields
   */
  const empty = () => {
    const newData = { ...defaults }
    for (const key in newData) newData[key] = ''
    newData.Uploaders = []
    setData(newData)
  }

  /*
   * Load defaults from API
   */
  useEffect(() => {
    const getDefaults = async () => {
      let result
      try {
        result = await api.getClientPackageDefaults('deb')
      } catch (err) {
        if (err) console.log(err)
      }
      if (result[1] === 200) {
        setDefaults(result[0])
        setData(result[0])
      }
    }
    getDefaults()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [refresh])

  /*
   * Method that triggers the API request
   */
  const buildPackage = async () => {
    setLoadingStatus([true, 'Contacting Morio Management API'])
    const [body, status] = await api.buildClientPackage('deb', data)
    if (status === 201) {
      setResult(body)
      // Force update of the revision
      setRefresh(refresh + 1)
      setLoadingStatus([true, 'Build request submitted', true, true])
    } else {
      setLoadingStatus([true, 'Build request failed', true, false])
    }
  }

  /*
   * Return result (if we have it)
   */
  if (result)
    return (
      <Popout note>
        <h3>Your build request was submitted</h3>
        <p>
          It will be processed without delay, but it can take a few seconds before your newly built
          package becomes available for download.
        </p>
        <div className="flex flex-row justify-between items-center">
          <PageLink className="btn btn-primary" href="/downloads">
            Go to the download page
          </PageLink>
          <button className="btn btn-primary" onClick={() => setResult(false)}>
            Build Another Package
          </button>
        </div>
      </Popout>
    )

  if (defaults === false) return <p>One moment please...</p>

  /*
   * Update method for the data.Uploaders array
   */
  const updateUploaders = (val, i) => {
    const newArr = [...data.Uploaders]
    newArr[i] = val
    setData({ ...data, Uploaders: newArr })
  }

  /*
   * Removes an uploader from the data.Uploaders array
   */
  const removeUploader = (i) => {
    const newArr = data.Uploaders.slice(0, i).concat(data.Uploaders.slice(i + 1))
    setData({ ...data, Uploaders: newArr })
  }

  /*
   * Adds an uploader to the data.Uploaders array
   */
  const addUploader = () => {
    const newArr = [...data.Uploaders, '']
    setData({ ...data, Uploaders: newArr })
  }

  /*
   * Update method for the data.Depends object
   */
  const updateDependencies = (name, version, i) => {
    const newArr = [...data.Depends]
    newArr[i] = [name, version]
    setData({ ...data, Depends: newArr })
  }

  /*
   * Removes a dependency from the data.Depends object
   */
  const removeDependency = (i) => {
    const newArr = data.Depends.slice(0, i).concat(data.Depends.slice(i + 1))
    setData({ ...data, Depends: newArr })
  }

  /*
   * Adds a dependency to the data.Depends object
   */
  const addDependency = () => {
    const newArr = [...data.Depends, ['', '']]
    setData({ ...data, Depends: newArr })
  }

  /*
   * Return form
   */
  return (
    <>
      <h2 className="flex flex-row justify-between items-center">
        <span>
          Create <b>.deb</b> Morio client package
        </span>
        <div className="flex flex-row gap-2">
          <button className="btn btn-primary btn-outline btn-sm" onClick={empty}>
            Clear Fields
          </button>
          <button
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => setData({ ...data, ...defaults })}
          >
            Prefill Fields
          </button>
        </div>
      </h2>
      <Tabs tabs="basics,advanced">
        <Tab tabId="basics" key="basics">
          <div className="grid grid-cols-2 gap-4 items-end">
            {Object.keys(fields.basics).map((field) => (
              <StringInput
                key={field}
                placeholder={defaults[field]}
                label={field}
                labelBL={fields.basics[field]}
                labelBR={<Docs field={field.toLowerCase()} />}
                valid={() => true}
                current={data[field]}
                update={(val) => {
                  const newData = { ...data }
                  newData[field] = val
                  setData(newData)
                }}
              />
            ))}
          </div>
        </Tab>
        <Tab tabId="advanced" key="advanced">
          <div className="grid grid-cols-2 gap-4 items-end">
            <StringInput
              placeholder={defaults.Source}
              label="Source Package Name"
              labelBL="The name to use for the source package"
              labelBR={<Docs field="source" />}
              valid={() => true}
              current={data.Source}
              update={(Source) => setData({ ...data, Source })}
            />
            {Object.keys(fields.advanced).map((field) => (
              <StringInput
                key={field}
                placeholder={defaults[field]}
                label={field}
                labelBL={fields.advanced[field]}
                labelBR={<Docs field={field.toLowerCase()} />}
                valid={() => true}
                current={data[field]}
                update={(val) => {
                  const newData = { ...data }
                  newData[field] = val
                  setData(newData)
                }}
              />
            ))}
          </div>
          <TextInput
            placeholder={defaults.DetailedDescription}
            label="Detailed description"
            labelBL="A multi-line description"
            valid={() => true}
            current={data.DetailedDescription}
            update={(val) => {
              const newData = { ...data }
              newData.DetailedDescription = val
              setData(newData)
            }}
          />
          <h5>Additional Maintainers</h5>
          {data.Uploaders &&
            data.Uploaders.map((san, i) => (
              <div className="flex flex-row gap-2 items-start" key={i}>
                <StringInput
                  placeholder="host.my.domain.eu"
                  label={`Maintainer #${i}`}
                  labelBL="A list of co-maintainers"
                  labelBR={<Docs field="uploaders" />}
                  valid={() => true}
                  current={data.Uploaders[i]}
                  update={(val) => updateUploaders(val, i)}
                />
                <button
                  className="btn btn-error btn-outline mt-9"
                  onClick={() => removeUploader(i)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          <p className="text-right">
            <button className="btn btn-success btn-sm" onClick={() => addUploader()}>
              <PlusIcon className="w-4 h-4" stroke={4} /> Add Maintainer
            </button>
          </p>
          <h5>Dependencies</h5>
          {data.Depends &&
            data.Depends.map((dep, i) => (
              <div className="flex flex-row gap-2 items-start" key={i}>
                <div className="grid grid-cols-2 gap-4 items-end w-full">
                  <StringInput
                    placeholder={dep[0]}
                    label={`Dependency #${i} name`}
                    labelBL="Dependency name"
                    labelBR={<Docs field="depends" />}
                    valid={() => true}
                    current={dep[0]}
                    update={(val) => updateDependencies(val, dep[1], i)}
                  />
                  <StringInput
                    placeholder={dep[1]}
                    label={`Dependency #${i} version`}
                    labelBL="Dependency version"
                    labelBR={<Docs field="depends" />}
                    valid={() => true}
                    current={dep[1]}
                    update={(val) => updateDependencies(dep[0], val, i)}
                  />
                </div>
                <button
                  className="btn btn-error btn-outline mt-9"
                  onClick={() => removeDependency(i)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          <p className="text-right">
            <button className="btn btn-success btn-sm" onClick={addDependency}>
              <PlusIcon className="w-4 h-4" stroke={4} /> Add Dependency
            </button>
          </p>
        </Tab>
      </Tabs>
      <p className="text-center">
        <button onClick={buildPackage} className="btn btn-primary btn-lg">
          Build .deb Package
        </button>
      </p>
    </>
  )
}

const DebPage = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={Debian} title={props.title}>
        <div className="max-w-4xl">
          <CreatePackage />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default DebPage

export const getStaticProps = () => ({
  props: {
    title: 'Morio Debian client builder',
    page: ['tools', 'pkgs', 'deb'],
  },
})
