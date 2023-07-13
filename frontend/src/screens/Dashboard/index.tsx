import React from "react";
import { logout } from "../../services/AuthService";
import { Button } from "@carbon/react";
import { Asleep, Light } from '@carbon/icons-react';
import { useThemePreference } from "../../utils/ThemePreference";
import { toggleTheme } from "../../utils/ThemeFunction";
import TestComponent from "../../components/TestComponent";


const Dashboard: React.FC = () => {
  
  
  const { theme, setTheme } = useThemePreference();
    return (
      <>
        <TestComponent/>
      </>
    );
  };

export default Dashboard;