import React from 'react';
import TestComponent from '../../components/TestComponent';
import { useAuth } from '../../contexts/AuthProvider';

const TestA: React.FC = () => {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <TestComponent user={user} testName="Test A" questionFileName="A" />
      ) : (
        <>
          <div className="h4">Null</div>
        </>
      )}
    </>
  );
};

export default TestA;
