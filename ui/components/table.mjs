import React from 'react'

/**
 * A table component to ensure overflow-scroll behaviour along the X-axis
 */
export const Table = ({ children }) => (
  <div className="max-w-full overflow-x-auto mt-4">
    <table className="w-full">{children}</table>
  </div>
)
