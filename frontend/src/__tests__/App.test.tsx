import React from 'react';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { Mock } from 'vitest';

const routerProviderMock = vi.fn();
const createBrowserRouterMock = vi.fn((routes: unknown[]) => ({ routes }));

vi.mock('../contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('lottie-react', () => ({
  LottieLight: () => <div data-testid="lottie-mock" />,
}));

vi.mock('../pages/AuthCallback', () => ({
  default: () => <div data-testid="auth-callback-page" />,
}));

vi.mock('../screens/Landing', () => ({
  default: () => <div data-testid="landing-page" />,
}));

vi.mock('../screens/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page" />,
}));

vi.mock('../screens/ErrorHandling', () => ({
  default: () => <div data-testid="error-page" />,
}));

vi.mock('../layouts/SideLayout', () => ({
  default: ({ pageContent }: { pageContent: React.ReactNode }) => (
    <div data-testid="side-layout">{pageContent}</div>
  ),
}));

import App, { appRoutes } from '../App';
import { useAuth } from '../contexts/AuthProvider';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    createBrowserRouter: (...args: Parameters<typeof actual.createBrowserRouter>) => {
      createBrowserRouterMock(...args);
      return { routes: args[0] };
    },
    RouterProvider: ({ router }: { router: unknown }) => {
      routerProviderMock(router);
      if (router && typeof router === 'object' && 'state' in router) {
        return (
          <actual.RouterProvider
            router={router as Parameters<typeof actual.RouterProvider>[0]['router']}
          />
        );
      }
      return <div data-testid="router-provider" />;
    },
  };
});

type MockAuthState = {
  user: undefined;
  userRoles: undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

const mockedUseAuth = useAuth as unknown as Mock;

const buildAuthState = (overrides?: Partial<MockAuthState>): MockAuthState => ({
  user: undefined,
  userRoles: undefined,
  isLoggedIn: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading indicator while auth state is loading', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoading: true }));

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(routerProviderMock).not.toHaveBeenCalled();
  });

  test('keeps a single stable route tree across auth transitions', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: false }));
    const { rerender } = render(<App />);

    expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
    const [initialRouter] = routerProviderMock.mock.calls[0];
    expect(appRoutes[0]).toMatchObject({ path: '/authCallback' });
    expect(appRoutes[2]).toMatchObject({ path: '*' });

    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: true }));
    rerender(<App />);

    expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
    expect(routerProviderMock.mock.calls[1][0]).toBe(initialRouter);
  });

  test('renders Landing for unauthenticated users on protected and fallback routes', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: false }));

    const dashboardRouter = createMemoryRouter(appRoutes, { initialEntries: ['/dashboard'] });
    const { unmount } = render(<RouterProvider router={dashboardRouter} />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    unmount();

    const unknownRouter = createMemoryRouter(appRoutes, { initialEntries: ['/unknown'] });
    render(<RouterProvider router={unknownRouter} />);
    expect(screen.getByTestId('landing-page')).toBeInTheDocument();
  });

  test('renders AuthCallback even when an unexpired user session is already active', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: true }));

    const callbackRouter = createMemoryRouter(appRoutes, { initialEntries: ['/authCallback'] });
    render(<RouterProvider router={callbackRouter} />);

    expect(screen.getByTestId('auth-callback-page')).toBeInTheDocument();
  });

  test('renders protected routes and ErrorHandling fallback when user is authenticated', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: true }));

    const dashboardRouter = createMemoryRouter(appRoutes, { initialEntries: ['/dashboard'] });
    const { unmount } = render(<RouterProvider router={dashboardRouter} />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    unmount();

    const unknownRouter = createMemoryRouter(appRoutes, { initialEntries: ['/unknown'] });
    render(<RouterProvider router={unknownRouter} />);
    expect(screen.getByTestId('error-page')).toBeInTheDocument();
  });
});
