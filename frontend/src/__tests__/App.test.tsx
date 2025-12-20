import React from 'react';
import { render } from '@testing-library/react';
import type { Mock } from 'vitest';

const routerProviderMock = vi.fn();
const createBrowserRouterMock = vi.fn((routes: unknown[]) => ({ routes }));

vi.mock('../contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('lottie-react', () => ({
  __esModule: true,
  default: () => <div data-testid="lottie-mock" />,
}));

import App from '../App';
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

  test('creates public router when user is not authenticated', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: false }));

    render(<App />);

    expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
    const [routes] = createBrowserRouterMock.mock.calls[0];
    expect(Array.isArray(routes)).toBe(true);
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({ path: '*' });
    expect(routerProviderMock).toHaveBeenCalledWith({ routes });
  });

  test('creates private router when user is authenticated', () => {
    mockedUseAuth.mockReturnValue(buildAuthState({ isLoggedIn: true }));

    render(<App />);

    expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
    const [routes] = createBrowserRouterMock.mock.calls[0];
    expect(routes).toHaveLength(2);
    const protectedRoute = routes[0] as { children?: Array<{ path?: string }> };
    expect(protectedRoute.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: '/dashboard' })]),
    );
    expect(routerProviderMock).toHaveBeenCalledWith({ routes });
  });
});
