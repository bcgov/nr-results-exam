import { useCallback, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  SideNavLink
} from '@carbon/react';
import * as Icons from '@carbon/icons-react';
import './BCHeaderwSide.scss';

import RightPanelTitle from '../RightPanelTitle';
import ThemeToggle from '../ThemeToggle';
import MyProfile from '../MyProfile';

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
        name: 'Home',
        icon: 'Home',
        link: '/dashboard',
        disabled: false
      },
      {
        name: 'TestA',
        icon: 'Dashboard',
        link: '/testA',
        disabled: false
      },
      {
        name: 'TestB',
        icon: 'Dashboard',
        link: '/testB',
        disabled: false
      },
      {
        name: 'TestC',
        icon: 'Dashboard',
        link: '/testC',
        disabled: false
      },
    ]
  }
];

const BCHeaderwSide = () => {
  const [myProfile, setMyProfile] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<boolean>(false);
  const [goToURL, setGoToURL] = useState<string>('');
  const [goTo, setGoTo] = useState<boolean>(false);


  const handleMyProfilePanel = useCallback((): void => {
    if (myProfile) {
      setMyProfile(false);
    } else {
      setMyProfile(true);
    }
    setNotifications(false);
  }, [myProfile]);

  const closeMyProfilePanel = useCallback((): void => {
    setMyProfile(false);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (goTo) {
      setGoTo(false);
      navigate(goToURL);
    }
  }, [goTo, goToURL, navigate]);

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
            <span className="header-full-name"> RESULTS EXAM </span>
          </Link>
          <HeaderGlobalBar className="align-items-center">
            <div className="mx-2">
              <ThemeToggle/>
            </div>
            
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
          <HeaderPanel aria-label="User Profile Tab" expanded={myProfile} className="notifications-panel">
            <RightPanelTitle
              title="My Profile"
              closeFn={closeMyProfilePanel}
            />
            <MyProfile/>
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
            </SideNavItems>
          </SideNav>
        </Header>
      )}
    />
  );
};

export default BCHeaderwSide;
