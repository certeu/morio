import { useAtom } from 'jotai'
import { atomWithHash } from 'jotai-location'

const viewAtom = (initial) => atomWithHash('view', initial)

export const useView = (initial) => {
  return useAtom(viewAtom(initial))
}
