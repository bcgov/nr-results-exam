import React, { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useThemePreference } from '../../utils/ThemePreference';
import { toggleTheme } from '../../utils/ThemeFunction';
import {
  HeaderContainer,
  Header,
  SkipToContent,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  HeaderPanel,
  SideNav,
  SideNavItems,
  SideNavLink,
  Button
} from '@carbon/react';
import * as Icons from '@carbon/icons-react';
import './BCHeaderwSide.scss';

import RightPanelTitle from '../RightPanelTitle';
import { logout } from '../../services/AuthService';

interface ListItem {
  name: string;
  icon: string;
  link: string;
  disabled: boolean;
}
interface ListItems {
  name: string;
  items: ListItem[]
}

const listItems = [
  {
    name: 'Main activities',
    items: [
      {
        name: 'Dashboard',
        icon: 'Dashboard',
        link: '/dashboard',
        disabled: false
      },
      {
        name: 'Test B',
        icon: 'Catalog',
        link: '/testB',
        disabled: true
      },
      {
        name: 'Test C',
        icon: 'Catalog',
        link: '/testC',
        disabled: true
      }
    ]
  }
];

const BCHeaderwSide = () => {
  //can only be impored at component level
  const { theme, setTheme } = useThemePreference();

  const version: string = `Version: ${process.env.REACT_APP_MAIN_VERSION}`;

  const [myProfile, setMyProfile] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<boolean>(false);
  const [overlay, setOverlay] = useState<boolean>(false);
  const [goToURL, setGoToURL] = useState<string>('');
  const [goTo, setGoTo] = useState<boolean>(false);

  const handleNotificationsPanel = useCallback((): void => {
    if (notifications) {
      setOverlay(false);
      setNotifications(false);
    } else {
      setOverlay(true);
      setNotifications(true);
    }
    setMyProfile(false);
  }, [notifications]);

  const handleMyProfilePanel = useCallback((): void => {
    if (myProfile) {
      setOverlay(false);
      setMyProfile(false);
    } else {
      setOverlay(true);
      setMyProfile(true);
    }
    setNotifications(false);
  }, [myProfile]);

  const closeNotificationsPanel = useCallback((): void => {
    setOverlay(false);
    setNotifications(false);
  }, []);

  const closeMyProfilePanel = useCallback((): void => {
    setOverlay(false);
    setMyProfile(false);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (goTo) {
      setGoTo(false);
      navigate(goToURL);
    }
  }, [goTo]);

  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }: any) => (
        <Header
          aria-label="React TS Carbon Quickstart"
          className="quickstart-header"
          data-testid="header"
        >
          <SkipToContent />
          <HeaderMenuButton
            aria-label="Open menu"
            onClick={onClickSideNavExpand}
            isActive={isSideNavExpanded}
          />
          <Link to="/" className="header-link" data-testid="header-name">
            BCGOV
            <span className="header-full-name"> Results Exam </span>
          </Link>
          <HeaderGlobalBar>
           <HeaderGlobalAction
                  aria-label={theme==='g10'?'Switch to Dark Mode':'Switch to Light Mode'}
                  tooltipAlignment="end"
                  onClick = {()=>{toggleTheme(theme,setTheme)}}
                  >
                  {/* Must have a child component */}
                  <>{theme === 'g10'?<Icons.Asleep size={20} />:<Icons.Light size={20} />}</>
            </HeaderGlobalAction>
            <HeaderGlobalAction
              aria-label="Notifications"
              data-testid="header-button__notifications"
              onClick={handleNotificationsPanel}
              isActive={notifications}
            >
              <Icons.Notification size={20} />
            </HeaderGlobalAction>
            <HeaderGlobalAction
              aria-label="User Settings"
              tooltipAlignment="end"
              data-testid="header-button__user"
              onClick={handleMyProfilePanel}
              isActive={myProfile}
            >
              <Icons.UserAvatar size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
          <HeaderPanel aria-label="Notifications Tab" expanded={notifications} className="notifications-panel">
            <RightPanelTitle
              title="Notifications"
              closeFn={closeNotificationsPanel}
            />
          </HeaderPanel>
          <HeaderPanel aria-label="User Profile Tab" expanded={myProfile} className="notifications-panel">
            <RightPanelTitle
              title="My Profile"
              closeFn={closeMyProfilePanel}
            />
            <div className="m-3">
            <div className="h5">Hello User</div>
            <Button kind='secondary' onClick={()=>console.log('Hi Jazz')}>Log Out</Button>
            </div>
          </HeaderPanel>
          <SideNav isChildOfHeader expanded={isSideNavExpanded} aria-label="Side menu" className="bcheaderwside-sidenav">
            <SideNavItems>
              {listItems.map((item: ListItems) => (
                <div key={item.name}>
                  {item.items.map((subItem: ListItem) => {
                    const IconComponent = Icons[subItem.icon];
                    return (
                      <SideNavLink
                        key={subItem.name}
                        renderIcon={IconComponent || ''}
                        onClick={() => {
                          setGoToURL(subItem.link);
                          setGoTo(true);
                        }}
                        isActive={window.location.pathname === subItem.link}
                      >
                        {subItem.name}
                      </SideNavLink>
                    );
                  })}
                </div>
              ))}
              <div className="logout-section">
                <SideNavLink className="cursor-pointer" renderIcon={Icons.Logout} onClick={()=>{logout()}}>Logout</SideNavLink>
              </div>
            </SideNavItems>
            <p className=''>{version}</p>
          </SideNav>
        </Header>
      )}
    />
  );
};

export default BCHeaderwSide;