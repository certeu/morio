import { CloseIcon } from './icons.js'

export const ModalWrapper = ({
  children = null,
  bare = false,
  keepOpenOnClick = false,
  closeHandler,
}) => {
  const close = (evt) => {
    // Only process the first event
    if (evt?.event) evt.event.stopPropagation()
    closeHandler()
  }

  const stopClick = (evt) => evt.stopPropagation()

  return (
    <div className="modal-wrapper" onClick={close}>
      {bare ? (
        children
      ) : (
        <div onClick={keepOpenOnClick ? stopClick : null} className="modal-wrapper-content">
          {children}
          <button className="modal-wrapper-close-button" onClick={close}>
            <CloseIcon stroke={3} />
          </button>
        </div>
      )}
    </div>
  )
}
