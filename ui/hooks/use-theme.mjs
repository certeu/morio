/*
 * Import this library to sync state to local storage
 */
import useLocalStorageState from 'use-local-storage-state'

/*
 * Respect the user's choice indicating whether or not the prefer dark mode
 * This method checks that and returns the default theme
 */
const preferredTheme = () => {
  const prefersDarkMode =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(`(prefers-color-scheme: dark`).matches
      : undefined

  return prefersDarkMode ? 'dark' : 'light'
}

/*
 * This is the actual React hook.
 * It takes no arguments and returns the theme (name) and theme setter
 */
export const useTheme = () => {
  const [theme, setTheme] = useLocalStorageState('morio-theme', preferredTheme())

  /*
   * Helper method to change the theme without having to check what is the current theme
   */
  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light')
    else setTheme('dark')
  }

  return { theme, setTheme, toggleTheme }
}

