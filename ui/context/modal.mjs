import { createContext, useState } from 'react'

export const ModalContext = createContext(null)

export const ModalContextProvider = ({ children }) => {
  const [stack, setStack ] = useState([])

  function clearModal() {
    setStack([])
  }

  function setModal(content) {
    setStack(Array.isArray(content) ? content : [content])
  }

  function pushModal(content) {
    setStack([content, ...stack])
  }

  function popModal() {
    setStack([...stack].slice(1))
  }

  return <ModalContext.Provider value={{
    modalContent: stack[0],
    setModal,
    clearModal,
    pushModal,
    popModal,
    stackCount: stack.length
  }}>{children}</ModalContext.Provider>
}
