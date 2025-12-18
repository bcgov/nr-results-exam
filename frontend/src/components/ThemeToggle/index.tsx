import { useEffect, useState } from 'react';
import './ThemeToggle.scss';
import { AsleepFilled, LightFilled } from '@carbon/icons-react';
import { useThemePreference } from '../../utils/ThemePreference';
import { toggleTheme } from '../../utils/ThemeFunction';

const ThemeToggle = () => {
  const { theme, setTheme } = useThemePreference();
  const [isToggled, setIsToggled] = useState(theme === 'g10' ? false : true);

  useEffect(() => {
    setIsToggled(theme === 'g10' ? false : true);
  }, [theme]);

  const handleToggle = async () => {
    toggleTheme(theme, setTheme);
    // keep the logic opposite at the time of sending the toggle
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={`theme-toggle ${isToggled ? 'on' : 'off'}`}
      data-testid="theme-toggle"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isToggled ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isToggled}
    >
      <div className="circle">
        {isToggled ? <AsleepFilled className="icon" /> : <LightFilled className="icon" />}
      </div>
    </div>
  );
};

export default ThemeToggle;
