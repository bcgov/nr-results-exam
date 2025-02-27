import {
  BrowserRouter, Routes, Route,
  RouteObject,
  Navigate,
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import './custom.scss';

import Landing from "./screens/Landing";
import Help from "./screens/Help";
import Reports from './screens/Reports';
import TopLayout from './layouts/TopLayout';
import SideLayout from './layouts/SideLayout';
import Dashboard from './screens/Dashboard';
import TestB from './screens/TestB';
import ProtectedRoute from './routes/ProtectedRoute';
import TestC from './screens/TestC';
import TestA from './screens/TestA';
import ErrorHandling from './screens/ErrorHandling';
import { useAuth } from './contexts/AuthProvider';
import path from 'path';

const publicRoutes: RouteObject[] = [
  {
    path: '*',
    element: <Landing />
  }
];

const privateRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorHandling />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" /> },
      {
        path: "/dashboard",
        element: <SideLayout pageContent={<Dashboard />} />,
      },
      { path: "/testA", element: <SideLayout pageContent={<TestA />} /> },
      { path: "/testB", element: <SideLayout pageContent={<TestB />} /> },
      { path: "/testC", element: <SideLayout pageContent={<TestC />} /> },
      { path: "/reports", element: <SideLayout pageContent={<Reports />} /> },
    ],
  },
  // catch all route for unmatched routes
  {
    path: '*',
    element: <ErrorHandling />
  }
];

const App: React.FC = () => {
  const auth = useAuth();
  const browserRouter = createBrowserRouter(auth.isLoggedIn ? privateRoutes : publicRoutes);
  return (
    <RouterProvider router={browserRouter} />
  );
};

export default App;
