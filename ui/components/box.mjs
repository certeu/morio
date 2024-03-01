/**
 * Little helper component to display a box
 */
export const Box = ({ color, children }) => (
  <div
    className={`bg-${color} text-${color}-content rounded-lg p-4 w-full bg-opacity-80 shadow mb-2`}
  >
    {children}
  </div>
)
