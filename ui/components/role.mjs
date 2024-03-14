import { roles } from 'config/roles.mjs'

const roleColors = {
  user: 'primary',
  manager: 'secondary',
  operator: 'success',
  engineer: 'warning',
  root: 'error',
}

export const Role = ({ role }) =>
  roles.includes(role) ? (
    <span className={`badge font-bold text-${roleColors[role]}-content badge-${roleColors[role]}`}>
      {role}
    </span>
  ) : (
    <span className="badge font-bold badge-neutral text-neutral-content">
      {role} (unknown role)
    </span>
  )
