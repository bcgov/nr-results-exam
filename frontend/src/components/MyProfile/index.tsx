import { SideNavLink, Loading } from '@carbon/react';
import * as Icons from '@carbon/icons-react';

import AvatarImage from '../AvatarImage';

import { useThemePreference } from '../../utils/ThemePreference';

import './MyProfile.scss';
import { useAuth } from '../../contexts/AuthProvider';

const MyProfile = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useThemePreference();

  const changeTheme = () => {
    if (theme === 'g10') {
      setTheme('g100');
      localStorage.setItem('mode', 'dark');
    }
    if (theme === 'g100') {
      setTheme('g10');
      localStorage.setItem('mode', 'light');
    }
  };

  return user ? (
    <>
      <div className="user-info-section">
        <div className="user-image">
          <AvatarImage userName={`${user.firstName} ${user.lastName}`} size="large" />
        </div>
        <div className="user-data">
          <p className="user-name">{`${user.firstName} ${user.lastName}`}</p>
          <p>{`IDIR: ${user.userName}`}</p>
          <p>{`Email: ${user.email}`}</p>
        </div>
      </div>
      <hr className="divisory" />
      <nav className="account-nav">
        <ul>
          <SideNavLink
            className="cursor-pointer"
            renderIcon={theme === 'g10' ? Icons.Asleep : Icons.Light}
            onClick={() => {
              changeTheme();
            }}
          >
            Change theme
          </SideNavLink>
          <SideNavLink
            className="cursor-pointer"
            renderIcon={Icons.UserFollow}
            onClick={() => {
              logout();
            }}
          >
            Log out
          </SideNavLink>
        </ul>
      </nav>
    </>
  ) : (
    <Loading description="Loading user details" withOverlay={true} />
  );
};

export default MyProfile;
