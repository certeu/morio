import { useContext } from 'react'
import { ModalContext } from 'context/modal.mjs'
import { ModalWrapper } from 'components/layout/modal-wrapper.mjs'
import { terminology } from 'prebuild/terminology.mjs'

/*
 * Lowercase and strip dots, then check if we have a definition for the term
 * If not, return false
 */
const asTerm = (term) => {
  if (typeof term !== 'string') return false
  term = term.toLowerCase().split('.').join('')

  return terminology[term] ? term : false
}

/*
 * React component to display the term info inside the modal wrapper
 */
const TermInfo = ({ term }) => {
  const Mdx = terminology[term].default

  return (
    <div className="w-full max-w-prose">
      <h3>{terminology[term].frontmatter.title}</h3>
      <Mdx />
    </div>
  )
}

/*
 * This is used for <em> tags.
 * If it's a term, if it wraps a term in our terminology, it will make it clickable.
 * If not, it will merely return the em tag.
 */
export const Term = ({ children }) => {
  const { pushModal } = useContext(ModalContext)
  const term = asTerm(children)

  return term ? (
    <button
      className="italic underline decoration-warning decoration-dotted decoration-2 hover:decoration-solid hover:cursor-pointer"
      title="Learn more"
      onClick={() =>
        pushModal(
          <ModalWrapper>
            <TermInfo term={term} />
          </ModalWrapper>
        )
      }
    >
      {children}
    </button>
  ) : (
    <em>{children}</em>
  )
}
