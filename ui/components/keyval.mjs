export const KeyVal = ({ k, val, color="primary" }) => (
  <span>
    <span className={`${sharedClasses} rounded-l-lg text-${color}-content bg-${color} border-${color}`}>
      {k}
    </span>
    <span className={`${sharedClasses} rounded-r-lg text-${color} bg-base-100 border-${color}`}>
      {val}
    </span>
  </span>
)

const sharedClasses = `px-1 text-sm font-medium whitespace-nowrap border-2`
