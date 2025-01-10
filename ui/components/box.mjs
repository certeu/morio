/**
 * Little helper component to display a box
 */
export const Box = ({ color, children, inline }) => (
  <div
    className={`bg-${color} text-${color}-content rounded-lg p-4 ${inline ? 'inline' : 'w-full'} bg-opacity-80 shadow mb-2`}
  >
    {children}
  </div>
)
