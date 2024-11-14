// Hooks
import { useState, useContext } from 'react'
import { useApi } from 'hooks/use-api.mjs'
// Context
import { ModalContext } from 'context/modal.mjs'
import { LoadingStatusContext } from 'context/loading-status.mjs'
// Components
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { Card, CardButton } from 'components/card.mjs'
import { PackageIcon, RestartIcon, ReseedIcon, KeyIcon, WrenchIcon } from 'components/icons.mjs'
import { SecretInput } from 'components/inputs.mjs'
import { mrtValid } from 'components/auth/mrt-provider.mjs'
import { Popout } from 'components/popout.mjs'
import { Highlight } from 'components/highlight.mjs'


const RestartConfirmation = ({ restart }) => (
  <>
    <h2>Restart Morio?</h2>
    <p>Click the button below to trigger a soft restart of Morio</p>
    <b>What will happen?</b>
    <p>
      Morio Core will reload the settings on disk and re-bootstrap itself.
      <br />
      One or more services will potentially be restarted.
    </p>
    <button className="btn btn-primary w-full" onClick={restart}>
      Restart Morio now
    </button>
  </>
)

const ReseedConfirmation = ({ reseed }) => (
  <>
    <h2>Reseed Morio?</h2>
    <p>Click the button below to trigger a reseed of Morio</p>
    <b>What will happen?</b>
    <p>
      Morio Core will use the current preseed settings to construct a new settings file.
      <br />
      It will then write that file to disk, and trigger a soft restart.
      <br />
      One or more services will likely be restarted.
    </p>
    <button className="btn btn-primary w-full" onClick={reseed}>
      Reseed Morio now
    </button>
  </>
)

const RotateRootTokenConfirmation = ({ rotateRootToken }) => {
  const [mrt, setMrt] = useState('')

  return (
    <div className="max-w-xl">
      <h2>Rotate the Morio Root Token?</h2>
      <p>
        Enter the current Root Token, then click the button to generate a new one.
      </p>
      <b>What will happen?</b>
      <p>
        Morio Core will generate a new Root Token and store its cryptographic hash.
        <br />
        There will be no downtime or service interruptions.
      </p>
      <SecretInput
        label="Morio Root Token"
        labelBL="The Morio Root Token was generated when you initially setup Morio"
        current={mrt}
        update={setMrt}
        valid={mrtValid}
      />
      <button className="btn btn-primary w-full" onClick={() => rotateRootToken(mrt)} disabled={mrtValid(mrt) ? false : true}>
        Rotate Morio Root Token
      </button>
    </div>
  )
}

const ActionsPage = (props) => {
  const { api } = useApi()
  const { pushModal, clearModal } = useContext(ModalContext)
  const { setLoadingStatus } = useContext(LoadingStatusContext)

  const restart = async () => {
    setLoadingStatus([true, 'Restarting Morio, this will take a while'])
    const result = await api.restart()
    if (result[1] !== 204) return setLoadingStatus([true, `Unable to restart Morio`, true, false])
    else setLoadingStatus([true, 'Restart initialized', true, true])
  }

  const reseed = async () => {
    setLoadingStatus([true, 'Reseeding Morio, this will take a while'])
    const result = await api.reseed()
    if (result[1] !== 204) return setLoadingStatus([true, `Unable to reseed Morio`, true, false])
    else setLoadingStatus([true, 'Reseed initialized', true, true])
  }

  const rotateRootToken = async (mrt) => {
    setLoadingStatus([true, 'Rotating the Morio Root Token, this should not take long'])
    const result = await api.rotateMrt(mrt)
    if (result[1] !== 200) return setLoadingStatus([true, `Unable to rotate the Morio Root Token`, true, false])
    else {
      setLoadingStatus([true, 'Sucessfully rotated the Morio Root Token', true, true])
      pushModal(
        <ModalWrapper keepOpenOnClick>
          <h3>Morio Root Token Rotated</h3>
          <Popout important>
            <h5>Store the Morio Root Token in a safe place</h5>
            <p>Below is the new Morio Root Token.</p>
            <Highlight>{result[0].root_token.value}</Highlight>
          </Popout>
          <p className="text-center">
            <button className="btn btn-primary nt-4 btn-lg" onClick={clearModal}>
              Close
            </button>
          </p>
        </ModalWrapper>
      )
    }
  }

  return (
    <PageWrapper {...props}>
      <ContentWrapper {...props} Icon={WrenchIcon} title={props.title}>
        <div
          className={`grid grid-cols-2 gap-4 items-center justify-between items-stretch max-w-4xl`}
        >
          <Card
            title="Build Packages"
            href="/actions/pkgs"
            desc="Trigger builds of packages pre-configured to integrate with this Morio collector."
            width="w-full"
            Icon={PackageIcon}
            role="operator"
          />
          <CardButton
            role="operator"
            title="Reseed Morio"
            onClick={() =>
              pushModal(
                <ModalWrapper>
                  <ReseedConfirmation reseed={reseed} />
                </ModalWrapper>
              )
            }
            desc="Use the current preseed settings to construct a new settings file. Then perform a soft restart."
            width="w-full"
            Icon={ReseedIcon}
          />
          <CardButton
            role="operator"
            title="Restart Morio"
            onClick={() =>
              pushModal(
                <ModalWrapper>
                  <RestartConfirmation restart={restart} />
                </ModalWrapper>
              )
            }
            desc="Restarts Morio Core (soft restart). One or more services will potentially be restarted."
            width="w-full"
            Icon={RestartIcon}
          />
          <CardButton
            role="engineer"
            title="Rotate Root Token"
            onClick={() =>
              pushModal(
                <ModalWrapper keepOpenOnClick>
                  <RotateRootTokenConfirmation rotateRootToken={rotateRootToken} />
                </ModalWrapper>
              )
            }
            desc="Generate a new Root Token and replace the current Morio Root Token with it."
            width="w-full"
            Icon={KeyIcon}
          />
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default ActionsPage

export const getStaticProps = () => ({
  props: {
    title: 'Actions',
    page: ['actions'],
  },
})
