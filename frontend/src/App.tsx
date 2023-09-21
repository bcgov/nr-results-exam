<<<<<<< HEAD
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
=======
import Box from '@mui/material/Box'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AppRoutes from '@/routes'
import { BrowserRouter } from 'react-router-dom'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  content: {
    flexGrow: 1,
    marginTop: '5em',
    marginRight: '1em',
    marginLeft: '1em',
    marginBottom: '5em',
    height: '100%',
  },
}
export default function App() {
  return (
    <Box sx={styles.container}>
      <Header />
      <Box sx={styles.content}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Box>
      <Footer />
    </Box>
  )
}
>>>>>>> 2577926 (Initial commit)
