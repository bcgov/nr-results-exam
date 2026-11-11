import { useMemo } from 'react';
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { Loading } from '@carbon/react';
import './custom.scss';

import Landing from './screens/Landing';
import SideLayout from './layouts/SideLayout';
import Dashboard from './screens/Dashboard';
import TestB from './screens/TestB';
import ProtectedRoute from './routes/ProtectedRoute';
import TestC from './screens/TestC';
import TestA from './screens/TestA';
import ErrorHandling from './screens/ErrorHandling';
import AuthCallback from './pages/AuthCallback';
import { useAuth } from './contexts/AuthProvider';

const AuthGate: React.FC = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <ProtectedRoute /> : <Landing />;
};

const AuthenticatedFallback: React.FC = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <ErrorHandling /> : <Landing />;
};

export const appRoutes: RouteObject[] = [
  {
    path: '/authCallback',
    element: <AuthCallback />,
  },
  {
    element: <AuthGate />,
    errorElement: <ErrorHandling />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" /> },
      {
        path: '/dashboard',
        element: <SideLayout pageContent={<Dashboard />} />,
      },
      { path: '/testA', element: <SideLayout pageContent={<TestA />} /> },
      { path: '/testB', element: <SideLayout pageContent={<TestB />} /> },
      { path: '/testC', element: <SideLayout pageContent={<TestC />} /> },
    ],
  },
  {
    path: '*',
    element: <AuthenticatedFallback />,
  },
];

const App: React.FC = () => {
  const auth = useAuth();
  const browserRouter = useMemo(() => createBrowserRouter(appRoutes), []);

  if (auth.isLoading) {
    return <Loading description="Loading..." withOverlay={true} />;
  }

  return <RouterProvider router={browserRouter} />;
};

export default App;
