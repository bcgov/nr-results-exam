import React from "react";
import { useAuth } from "../../contexts/AuthProvider";
import TestComponent from "../../components/TestComponent";

const TestC: React.FC = () => {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <TestComponent user={user} testName="Test C" questionFileName="C" />
      ) : (
        <>
          <div className="h4">Null</div>
        </>
      )}
    </>
  );
};

export default TestC;
