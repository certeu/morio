import { logoPath } from 'components/icons.mjs'

export const Spinner = ({ className = 'h-6 w-6 animate-spin' }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

export const LogoSpinner = () => (
  <svg
    className="w-full max-w-full max-h-full animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    style={{ animation: 'spin 3s linear infinite' }}
  >
    <path cx="12" cy="12" d={logoPath} fill="currentColor" strokeWidth="0" />
  </svg>
)

export const Progress = ({ value, color = 'primary' }) => (
  <div className={`h-2 bg-${color} rounded-full my-1 bg-opacity-30`}>
    <div
      className={`h-2 bg-${color} rounded-full transition-all ease-in-out duration-500`}
      style={{ width: `${value}%` }}
    ></div>
  </div>
)
