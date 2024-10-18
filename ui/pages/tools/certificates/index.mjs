// Dependencies
import Joi from 'joi'
// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { PlusIcon, CertificateIcon, TrashIcon, WarningIcon } from 'components/icons.mjs'
import { StringInput } from 'components/inputs.mjs'
import { Markdown } from 'components/markdown.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'

/*
 * X.509 certificate
 */
const certificateSchema = Joi.object({
  cn: Joi.string().required().min(1),
  c: Joi.string().required().min(2).max(2).description('Country'),
  st: Joi.string().required().min(1),
  l: Joi.string().required().min(1),
  o: Joi.string().required().min(1),
  ou: Joi.string().required().min(1),
  san: Joi.array().required().unique().items(Joi.string().hostname()),
})

/*
 * Helper object to not have to type so much
 */
const prefill = {
  cn: 'A Morio Certificate',
  c: 'BE',
  st: 'Brussels',
  l: 'Brussels',
  o: 'CERT-EU',
  ou: 'Engineering Team',
}

/**
 * A method to provide validation based on the Joi validation library
 *
 * @param {object} data - The data to validate
 * @return {object} result - The Joi validation result object
 */
export const validate = (data) => {
  let result = true
  try {
    result = certificateSchema.validate(data)
  } catch (err) {
    return false
  }

  return result
}

/*
 * A helper object to use as initial state
 */
const empty = () =>
  JSON.parse(
    JSON.stringify({
      cn: '',
      c: '',
      st: '',
      l: '',
      o: '',
      ou: '',
      san: [],
    })
  )

/**
 * The actual component, in case we want to extract it for re-use later
 */
const CreateCertificate = () => {
  /*
   * Loading context
   */
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const [result, setResult] = useState(false)

  /*
   * This will hold the form state
   */
  const [data, setData] = useState(empty())

  /*
   * We'll need the API
   */
  const { api } = useApi()

  /*
   * Method that triggers the API request
   */
  const createCertificate = async () => {
    setLoadingStatus([true, 'Contacting Morio Management API'])
    const [body, status] = await api.createCertificate(data)
    if (status === 201) {
      setResult(body)
      setLoadingStatus([true, 'Certificate created', true, true])
    }
    else if (status === 403 && body.title) {
      setLoadingStatus([true, body.title, true, false])
    } else {
      setLoadingStatus([true, 'Certificate creation failed', true, false])
    }
  }

  /*
   * Update method for the data.san array
   */
  const updateSan = (val, i) => {
    const newSan = [...data.san]
    newSan[i] = val
    setData({ ...data, san: newSan })
  }

  /*
   * Removes a SAN from the data.san array
   */
  const removeSan = (i) => {
    const newSan = data.san.slice(0, i).concat(data.san.slice(i + 1))
    setData({ ...data, san: newSan })
  }

  /*
   * Adds a SAN to the data.san array
   */
  const addSan = () => {
    const newSan = [...data.san, '']
    setData({ ...data, san: newSan })
  }

  /*
   * Validation result
   * This will fail when generating wildcard certificates
   * because *.domain.com is not a valid hostname.
   * So we will replace * at the start with a letter just for validation
   */
  const valid = validate({
    ...data,
    san: data.san.map((name) => (name[0] === '*' ? 'a' + name.slice(1) : name)),
  })

  /*
   * Return result (if we have it)
   */
  if (result)
    return (
      <>
        <h2 className="flex flex-row justify-between items-center">
          <span>Your X.509 certificate</span>
          <div className="flex flex-row gap-2">
            <button className="btn btn-primary" onClick={() => setResult(false)}>
              Generate Another
            </button>
          </div>
        </h2>
        <h3>Certificate</h3>
        <Highlight title="The Leaf Certificate">{result.certificate.crt}</Highlight>
        <h3>The Private Key</h3>
        <Highlight title="The Private Key">{result.key}</Highlight>
        <h3>CA Certificate</h3>
        <Highlight title="The CA Certificate">{result.certificate.ca}</Highlight>
        <h3>Certificate Chain</h3>
        <Highlight title="The Certificate Chain">{result.certificate.certChain}</Highlight>
      </>
    )

  /*
   * Return form
   */
  return (
    <>
      <h2 className="flex flex-row justify-between items-center">
        <span>Create a X.509 certificate</span>
        <div className="flex flex-row gap-2">
          <button className="btn btn-primary btn-outline btn-sm" onClick={() => setData(empty())}>
            Clear Fields
          </button>
          <button
            className="btn btn-primary btn-outline btn-sm"
            onClick={() => setData({ ...data, ...prefill })}
          >
            Prefill Fields
          </button>
        </div>
      </h2>
      <div className="grid grid-cols-2 gap-4 items-end">
        <StringInput
          placeholder={prefill.cn}
          label="Common Name"
          labelBL="Any name will do here"
          valid={() => true}
          current={data.cn}
          update={(cn) => setData({ ...data, cn })}
        />

        <StringInput
          placeholder={prefill.c}
          label="Country"
          labelBL="A 2-letter language code"
          valid={() => true}
          current={data.c}
          update={(c) => setData({ ...data, c })}
        />

        <StringInput
          placeholder={prefill.st}
          label="State"
          labelBL="A state, province, or region"
          valid={() => true}
          current={data.st}
          update={(st) => setData({ ...data, st })}
        />

        <StringInput
          placeholder={prefill.l}
          label="Locality"
          labelBL="A city or municipality"
          valid={() => true}
          current={data.l}
          update={(l) => setData({ ...data, l })}
        />

        <StringInput
          placeholder={prefill.o}
          label="Organisation"
          labelBL="Name of your organisation"
          valid={() => true}
          current={data.o}
          update={(o) => setData({ ...data, o })}
        />

        <StringInput
          placeholder={prefill.ou}
          label="Organisational Unit"
          labelBL="Name of your department"
          valid={() => true}
          current={data.ou}
          update={(ou) => setData({ ...data, ou })}
        />
      </div>
      {data.san.map((san, i) => (
        <div className="flex flex-row gap-2 items-start" key={i}>
          <StringInput
            placeholder="host.my.domain.eu"
            label={`Subject Alternative Name #${i}`}
            labelBL="A FQDN to add to this certificate"
            valid={() => true}
            current={data.san[i]}
            update={(val) => updateSan(val, i)}
          />
          <button className="btn btn-error btn-outline mt-9" onClick={() => removeSan(i)}>
            <TrashIcon />
          </button>
        </div>
      ))}
      <p className="text-right">
        <button className="btn btn-success btn-sm" onClick={() => addSan()}>
          <PlusIcon className="w-4 h-4" stroke={4} /> Add SAN
        </button>
      </p>
      {valid.error ? (
        <Popout warning>
          <h4>Validation failed</h4>
          <ul className="list list-inside">
            {valid.error.details.map((err) => (
              <li key={err.type} className="flex flex-row gap-2 items-start">
                <WarningIcon className="w-6 h-6 text-warning" />
                <Markdown key={err.type}>{err.message}</Markdown>
              </li>
            ))}
          </ul>
          <p>You need to address these validation errors before you can create a certificate.</p>
        </Popout>
      ) : null}
      <p className="text-center">
        <button onClick={createCertificate} className="btn btn-primary btn-lg">
          Create Certificate
        </button>
      </p>
    </>
  )
}

const X509Page = (props) => {
  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={CertificateIcon} title={props.title}>
        <div className="max-w-4xl">
          <CreateCertificate />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default X509Page

export const getStaticProps = () => ({
  props: {
    title: 'X.509 Certificates',
    page: ['tools', 'certificates'],
  },
})
