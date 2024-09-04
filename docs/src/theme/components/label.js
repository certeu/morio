const styles = {
  default: {
    backgroundColor: 'var(--ifm-color-info)',
    color: 'var(--ifm-color-info-contrast-background)',
  },
  success: {
    backgroundColor: 'var(--ifm-color-success)',
    color: 'var(--ifm-color-danger-contrast-background)',
  },
  warning: {
    backgroundColor: 'var(--ifm-color-warning)',
    color: '#000',
  },
  danger: {
    backgroundColor: 'var(--ifm-color-danger)',
    color: '#fff',
  },
}

export const Label = ({ children, style = 'default' }) => (
  <span
    style={{
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: '95%',
      ...styles[style],
    }}
  >
    {children}
  </span>
)
