export const toggleTheme = (theme: string, setTheme: (theme: string) => void) => {
  if (theme === 'g10') {
    setTheme('g100');
    localStorage.setItem('mode', 'dark');
  }
  if (theme === 'g100') {
    setTheme('g10');
    localStorage.setItem('mode', 'light');
  }
};
