import { useState } from 'react'

export const useSelection = (items) => {
  const [selection, setSelection] = useState({})

  // Helper var to see how many are selected
  const count = Object.keys(selection).length

  // Helper method to toggle single selection
  const toggle = (id) => {
    const newSelection = { ...selection }
    if (newSelection[id]) delete newSelection[id]
    else newSelection[id] = 1
    setSelection(newSelection)
  }

  // Helper method to toggle select all
  const toggleAll = () => {
    if (count === items.length) setSelection({})
    else {
      const newSelection = {}
      for (const item of items) newSelection[item.id] = 1
      setSelection(newSelection)
    }
  }

  return {
    count,
    selection,
    setSelection,
    toggle,
    toggleAll,
  }
}

