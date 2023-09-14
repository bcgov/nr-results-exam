import React from "react";
import { useSelector } from "react-redux";
import TestComponent from "../../components/TestComponent";


const Dashboard: React.FC = () => {
  const userDetails = useSelector((state:any) => state.userDetails)
  const { user } = userDetails
    return (
      <>
        {user?<TestComponent user={user} testName="Test A" questionFileName="questions/questionsA.yaml"/>:<><div className="h4">Null</div></>}
      </>
    );
  };

export default Dashboard;