import React from "react";
import { logout } from "../../services/AuthService";
import { Button } from "@carbon/react";
import { Asleep, Light } from '@carbon/icons-react';
import { useThemePreference } from "../../utils/ThemePreference";
import { useSelector } from "react-redux";
import { toggleTheme } from "../../utils/ThemeFunction";
import TestComponent from "../../components/TestComponent";


const TestC: React.FC = () => {
  const userDetails = useSelector((state:any) => state.userDetails)
  const { loading, error, user } = userDetails
  
  const { theme, setTheme } = useThemePreference();
    return (
      <>
        {user?<TestComponent user={user.userInfo} testName="Test C" questionFileName="questions/questionsC.yaml"/>:<><div className="h4">Null</div></>}
      </>
    );
  };

export default TestC;