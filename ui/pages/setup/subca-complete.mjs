// Context
import { LoadingStatusContext } from 'context/loading-status.mjs'
import { ModalContext } from 'context/modal.mjs'
// Hooks
import { useEffect, useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { Box } from 'components/box.mjs'
import { Highlight } from 'components/highlight.mjs'
import { SplashLayout } from 'components/layout/splash.mjs'
import { TextInput } from 'components/inputs.mjs'
import { Link, linkClasses } from 'components/link.mjs'
import {
  BoolYesIcon,
  BoolNoIcon,
  CertificateIcon,
  RightIcon,
  OkIcon,
  MorioIcon,
  DarkThemeIcon,
  LightThemeIcon,
  WarningIcon,
} from 'components/icons.mjs'
import { useTheme } from 'hooks/use-theme.mjs'
import { EphemeralInfo } from 'pages/index.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Spinner } from 'components/animations.mjs'
import { EphemeralWrapper } from './index.mjs'
import { MiniTip } from 'components/mini.mjs'

const placeholder = `-----BEGIN CERTIFICATE-----
MIIGOTCCBCGgAwIBAgIBATANBgkqhkiG9w0BAQsFADCBkzELMAkGA1UEBhMCQkUx
ETAPBgNVBAgTCEJydXNzZWxzMREwDwYDVQQHEwhCcnVzc2VsczEZMBcGA1UEChMQ
RW5naW5lZXJpbmcgVGVhbTEYMBYGA1UECxMPTm8gT1Ugc3BlY2lmaWVkMSkwJwYD
VQQDEyBNb3JpbyBSb290IENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0yNTA2MTMx
NDA5MzVaFw0zMDA2MTMxNDA5MzVaMIGbMQswCQYDVQQGEwJCRTERMA8GA1UECBMI
QnJ1c3NlbHMxETAPBgNVBAcTCEJydXNzZWxzMRkwFwYDVQQKExBFbmdpbmVlcmlu
ZyBUZWFtMRgwFgYDVQQLEw9ObyBPVSBzcGVjaWZpZWQxMTAvBgNVBAMTKE1vcmlv
IEludGVybWVkaWF0ZSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwggIiMA0GCSqGSIb3
DQEBAQUAA4ICDwAwggIKAoICAQC+PfwW+kjt87pk+NYB/ga8pYB5RhFtKsFIVHaz
p+u5tEF1BODYD33ExTPT8YcMwzy7vzFfSpZy0aWGUhcYr6hwRcFZnG9CdKaQwqgd
M7cYjYQUMbihYxTm2eHb2VVQdKsx6Ny2FI7YLeUW+g01/vAJdYQ9cuFxfaaQBnnf
Si9OpYdczYu34E86QFz5VSbDND37hzvhs+N6jw3h8uFgkswnpb6qurKrUW9pdPFd
TXtmMXTdlvZEy8Pato53Z/jCuo53P68Kd7Un9R+9ZAT10R8yDofhuJSCXhV4k/HA
sQaGsDfK+TxL48NkfWj5zJOgy7VyrsWr4Ta9ukMlh6gRlTm5QwrxOSVVi9tsIQxs
uWqClKrrp9EnUmUxIYuY0pXaU2s8Sj2iNJDtaELJkMdiltg30LH2poDNrilLtVQM
CS4+7NxfCJucq7/Ebc2nywAcqCG+c/w4OMu9oJR2y5u4sTLxWJvGn/89K32IykOk
VeOasYu6Gmr1sGotCFEbt5Bht99J1REi/b9ZOHa65jkKlqizLtz3+0uA6ntGN7cH
7TulHGVzWcatXiAcSD+FNeuJPkForONuqHa+hn0D+KFmSnXMTnuUrLP390OTmY8k
Vl7dN86Qv4SXllzvUcL2sMBCJle4cNyVZ++XKYuG0GWAWt+fTA6rmi6bsxptK6As
2SobwwIDAQABo4GNMIGKMAwGA1UdEwQFMAMBAf8wCwYDVR0PBAQDAgL0MDsGA1Ud
JQQ0MDIGCCsGAQUFBwMBBggrBgEFBQcDAgYIKwYBBQUHAwMGCCsGAQUFBwMEBggr
BgEFBQcDCDARBglghkgBhvhCAQEEBAMCAPcwHQYDVR0OBBYEFMTHwdlIdpMIVJ2i
AEmQ9dGH6UGnMA0GCSqGSIb3DQEBCwUAA4ICAQAt8xSfuNbIGh0x00f12ssefIOW
fTcmmWj9nkj867tgPoRtuae55fuRflnRB0v35lncD387gU1865yrvFlMbQDHiYDh
0YlxR63X05jGUVBy8CMENaWVeLsK2nyKwnYnEgPPicVFKhHDy4EqAn6Gur58psmR
GrWPveKrbbwTczuRp+Fo+7wVNm51UAJV1qq61IxmTLXKZ6lnCnygmMANkKE63lcQ
LMUd12M6rg3bQ63ARoLSrC5Xd0D85crD+pjIArwO3z/gf+9rhkHJjwdUC4jThUsE
cyKbXuPS+tay0iXmySxEXDBkcDh1e6lsELhRCyWXbHtWPEN/Jjqa1W7JBrmUJ8qU
1C/bZQki++xMGViSu1h4Q4wEvAh+NDqoQ6icIrArveWzdWwiierhhDAPV6U4BtaZ
XU32VXAeuCgCp+N39DVklul0Slz4Yzz9r35hXD0D6wuWc6/yzEGt93+igfX5XE8L
bgjOARjUJhqyeK/jOHisSmqAyGs8AjwzF5+hl7JV9+H55bGjps30RCFZtaHYf3uN
vY1zwHYwmEKvi6xQGVhVCWMqgFpCD3uLRCvlcP+JC43xDuH71narL9ioj5B6RHaQ
IzCzi7oE29tZqGWqHDiQRrgPFQazoeoHdpcIXeJ6JaM5TpV9Sur1g4Yo+mULENFX
tR4AyEjNz4K28Dq6Mg==
-----END CERTIFICATE-----`

const CompleteSubcaSettingsPage = (props) => {
  /*
   * React state
   */
  const [error, setError] = useState(false)
  const [validationResult, setValidationResult] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [certificate, setCertificate] = useState('')
  const [chain, setChain] = useState('')
  const [serial, setSerial] = useState('')
  const [status, setStatus] = useState(null)
  const [csr, setCsr] = useState(null)

  const { pushModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)
  const { api } = useApi()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const loadStatus = async () => {
      const [content] = await api.getStatus()
      setStatus(content)
      if (content?.core?.node?.subca_csr) {
        setCsr(content.core.node.subca_csr)
        setSerial(content.core.node.subca_serial)
      } else setError('noCsr')
    }
    if (!status) loadStatus()
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [])

  /*
   * Helper method to validate the certificate
   */
  const validate = async () => {
    setLoadingStatus([true, 'Validating certificates'])
    const [data, status] = await api.validateSubca({ certificate, chain, serial })
    if (status !== 200)
      return setLoadingStatus([true, `Certificate validation failed`, true, false])
    else {
      setValidationResult(data)
      setLoadingStatus([true, 'Validation completed', true, true])
    }
  }

  /*
   * Helper method to deploy the configuration
   */
  const deploy = async () => {
    setLoadingStatus([true, 'Deploying your settings, this will take a while', true, true])
    setDeployed('ongoing')
    const result = await api.subcaSetup({ certificate, chain, serial })
    if (result[1] !== 204) {
      setError('deployFailed')
      return setLoadingStatus([true, `Deploy failed`, true, false])
    } else {
      setDeployed(true)
      setLoadingStatus([true, 'Deployment initialized', true, true])
    }
  }

  // Props to pass down
  const drillProps = {
    ...props,
    theme,
    toggleTheme,
    pushModal,
    setValidationResult,
    deploy,
  }

  // Don't bother without a CSR
  if (error === 'noCsr') return <ErrorNoCsr {...drillProps} />

  // Show deploy result
  if (deployed === 'ongoing') return <CsrDeploying {...drillProps} />
  if (deployed) return <CsrDeployed {...drillProps} />

  // Show validation result
  if (validationResult) return <CsrValidationReport {...drillProps} report={validationResult} />

  return (
    <LocalPageWrapper {...drillProps}>
      <h3 className="flex flex-row items-center gap-2 justify-between">
        <div>{props.title}</div>
        <CertificateIcon className="w-10 h-10 text-success" />
      </h3>
      <pre>{JSON.stringify(deployed)}</pre>
      <details>
        <summary className="hover:cursor-pointer">
          <b>Current status</b>
        </summary>
        <PendingStatus {...{ pushModal, serial, csr }} />
      </details>
      <details open>
        <summary className="hover:cursor-pointer">
          <b>Next step</b>
        </summary>
        <h5>Provide Certificates for a Subordinate CA</h5>
        <p>To complete setup, we need two certificates:</p>
        <ul className="list list-inside list-disc ml-4">
          <li>
            <b>Intermediate Certificate</b>
            <small className="block ml-4 -mt-1">
              This is the result of signing{' '}
              <CsrModal {...{ pushModal, serial, csr }}>the CSR</CsrModal>
            </small>
          </li>
          <li>
            <b>Root Certificate</b>
            <small className="block ml-4 -mt-1">
              This is the root of the parent CA who signed{' '}
              <CsrModal {...{ pushModal, serial, csr }}>the CSR</CsrModal>
            </small>
          </li>
        </ul>
        <TextInput
          placeholder={placeholder}
          label="Intermediate Certificate"
          labelBL={<>This is the result of signing the CSR with the parent CA</>}
          valid={() => true}
          current={certificate}
          update={setCertificate}
          className="text-xs font-mono"
        />
        <TextInput
          placeholder={placeholder}
          label="Root Certificate / Trust Chain"
          labelBL="This is the root certificate / trust chain of the parent CA"
          valid={() => true}
          current={chain}
          update={setChain}
          className="text-xs font-mono"
        />
        <MiniTip>
          If the CSR was signed by an intermediate certificate authority, please include its
          certificate followed by the root certificate so we can complete the trust chain.
        </MiniTip>
        <p className="flex flex-row items-center justify-center gap-2">
          <button
            className="btn btn-primary"
            disabled={certificate.includes('BEGIN CERTIFICATE') ? false : true}
            onClick={validate}
          >
            Validate Certificate
          </button>
          <Link className="btn btn-primary btn-outline" href="/">
            Cancel
          </Link>
        </p>
      </details>
    </LocalPageWrapper>
  )
}

export default CompleteSubcaSettingsPage

export const getStaticProps = () => ({
  props: {
    title: 'Complete Pending Settings',
    page: ['setup', 'subca-complete'],
  },
})

const CsrValidationReport = (props) => (
  <LocalPageWrapper {...props}>
    <Box color={props.report.valid ? 'success' : 'error'}>
      <div className="flex flex-row gap-4 items-center w-full">
        {props.report.valid ? <OkIcon stroke={4} /> : <WarningIcon />}
        <div className="text-inherit">
          This certificate
          {props.report.valid ? <span> is </span> : <b className="px-1 underline">is NOT</b>}
          valid
        </div>
      </div>
    </Box>
    <ul className="mt-4">
      {props.report.success.map((item, i) => (
        <li key={i} className="flex flex-row items-center gap-2">
          <BoolYesIcon />
          <span>{item}</span>
        </li>
      ))}
      {props.report.error.map((item, i) => (
        <li key={i} className="flex flex-row items-center gap-2">
          <BoolNoIcon />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    {props.report.valid ? (
      <>
        <p className="text-center">
          <button className="btn btn-primary btn-lg mt-4" onClick={props.deploy}>
            Deploy Pending Settings
          </button>
        </p>
        <p className="text-center">
          <button className="btn btn-ghost" onClick={() => props.setValidationResult(false)}>
            Cancel
          </button>
        </p>
      </>
    ) : (
      <>
        <p>Please address the issues above, before we can continue.</p>
        <p className="text-center">
          <button className="btn btn-primary" onClick={() => props.setValidationResult(false)}>
            Back
          </button>
        </p>
      </>
    )}
  </LocalPageWrapper>
)

const CsrDeploying = (props) => (
  <LocalPageWrapper {...props}>
    <Box color="accent">
      <div className="flex flex-row gap-4 items-center w-full">
        <Spinner />
        <div className="text-inherit">Please wait while your settings are being deployed</div>
      </div>
    </Box>
  </LocalPageWrapper>
)

const CsrDeployed = (props) => (
  <LocalPageWrapper {...props}>
    <h4>Settings deployed</h4>
    <p>
      You can return to <Link href="/">the home page</Link>
    </p>
  </LocalPageWrapper>
)

export const ErrorNoCsr = (props) => (
  <LocalPageWrapper {...props}>
    <h5>No CSR Present</h5>
    <p>
      This page allows one to provide the certificate when configuring Morio as a subordinate
      Certificate Authority (CA).
      <br />
      As that does not seem to be the case, there is nothing to do here.
    </p>
    <p className="text-center">
      <Link className="btn btn-primary mt-4" href="/">
        Go to the Home Page
      </Link>
    </p>
  </LocalPageWrapper>
)

export const PendingStatus = ({ pushModal, serial, csr }) => (
  <ul className="list list-inside ml-4">
    <li className="flex flex-row items-center gap-2">
      <OkIcon className="w-5 h-5 text-success" stroke={4} />
      <span>Initial setup</span>
    </li>
    <li className="flex flex-row items-center gap-2">
      <OkIcon className="w-5 h-5 text-success" stroke={4} />
      <div>
        Generate <CsrModal {...{ pushModal, serial, csr }}>Certificate Signing Request</CsrModal>
      </div>
    </li>
    <li className="flex flex-row items-center gap-2 italic font-bold">
      <RightIcon className="w-5 h-5 text-warning animate-bounce-right-forever" stroke={4} />
      <div className="border-l-2 border-warning pl-2 py-2">
        <span>Provide Certificate for the Subordinate Certificate Authority</span>
        <span className="text-xs block text-warning">Currently waiting for this input</span>
      </div>
    </li>
    <li className="flex flex-row items-center gap-2">
      <OkIcon className="w-5 h-5 opacity-20" stroke={4} />
      <span>Complete Setup</span>
    </li>
  </ul>
)

export const LocalPageWrapper = (props) => (
  <PageWrapper {...props} layout={SplashLayout} header={false} footer={false} role={false}>
    <div className="px-4">
      <EphemeralWrapper>
        <div className="flex flex-col justify-between min-h-screen h-full py-2 mx-auto max-w-xl">
          <span> </span>
          <div>
            <h1 className="flex flex-row gap-2 items-center justify-between">
              <MorioIcon className="w-12 h-12 text-primary" />
              <div className="text-4xl text-center">Welcome to Morio</div>
              <button onClick={props.toggleTheme} title="Switch between dark and light mode">
                {props.theme === 'dark' ? (
                  <LightThemeIcon className="w-12 h-12 text-accent hover:text-warning" />
                ) : (
                  <DarkThemeIcon className="w-12 h-12 text-warning hover:text-accent" />
                )}
              </button>
            </h1>
            <div className="py-12 px-4 max-w-xl m-auto">{props.children}</div>
          </div>
          <div>
            <p className="text-sm text-center">
              <button
                onClick={() =>
                  props.pushModal(
                    <ModalWrapper>
                      <EphemeralInfo />
                    </ModalWrapper>
                  )
                }
                className="btn btn-warning btn-outline"
              >
                <div className="flex flex-row gap-4 items-center">
                  <WarningIcon />
                  <span>Running in Ephemeral State</span>
                  <WarningIcon />
                </div>
              </button>
            </p>
            <p className="text-center opacity-50 text-sm">
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
      </EphemeralWrapper>
    </div>
  </PageWrapper>
)

const CsrModal = ({ pushModal, serial, csr, children }) => (
  <button
    onClick={() =>
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <Highlight title={`CSR ${serial}`} label="Certificate Signing Request">
            {csr.replace(/\r\n/g, '\n')}
          </Highlight>
        </ModalWrapper>
      )
    }
    className={`text-secondary ${linkClasses}`}
  >
    {children}
  </button>
)
