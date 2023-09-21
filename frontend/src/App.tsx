import {
  BrowserRouter, Routes, Route
} from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import { isLoggedIn } from './services/AuthService';

import './custom.scss';

import Landing from "./screens/Landing";
import Help from "./screens/Help";
import Reports from './screens/Reports';
import TopLayout from './layouts/TopLayout';
import SideLayout from './layouts/SideLayout';
import Dashboard from './screens/Dashboard';
import TestB from './screens/TestB';
import PostLoginRoute from './routes/PostLoginRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import TestC from './screens/TestC';
import TestA from './screens/TestA';

Amplify.configure(awsconfig);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing/>} />
        <Route path="/dashboard" element={
          <PostLoginRoute signed={true}>
              <SideLayout pageContent={<Dashboard/>} />
          </PostLoginRoute>
        } />
        <Route path="/testA" element={
          <PostLoginRoute signed={true}>
              <SideLayout pageContent={<TestA/>} />
          </PostLoginRoute>
        } />
        <Route path="/testB" element={
          <PostLoginRoute signed={true}>
              <SideLayout pageContent={<TestB/>} />
          </PostLoginRoute>
        } />
        <Route path="/testC" element={
          <PostLoginRoute signed={true}>
              <SideLayout pageContent={<TestC/>} />
          </PostLoginRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute signed={true}>
            <SideLayout pageContent={<Reports/>} />
          </ProtectedRoute>
        } />
        <Route path="/help" element={<SideLayout pageContent={<Help/>} />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
