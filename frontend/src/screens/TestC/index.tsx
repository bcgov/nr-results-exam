import React from "react";
import { useSelector } from "react-redux";
import TestComponent from "../../components/TestComponent";


const TestC: React.FC = () => {
  const userDetails = useSelector((state:any) => state.userDetails)
  const { user } = userDetails
    return (
      <>
        {user?<TestComponent user={user} testName="Test C" questionFileName="C"/>:<><div className="h4">Null</div></>}
      </>
    );
  };

export default TestC;