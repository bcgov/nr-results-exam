import React from "react";
import { useAuth } from "../../contexts/AuthProvider";
import TestComponent from "../../components/TestComponent";

const TestB: React.FC = () => {
  const { user } = useAuth();
  return (
    <>
      {user ? (
        <TestComponent user={user} testName="Test B" questionFileName="B" />
      ) : (
        <>
          <div className="h4">Null</div>
        </>
      )}
    </>
  );
};

export default TestB;
