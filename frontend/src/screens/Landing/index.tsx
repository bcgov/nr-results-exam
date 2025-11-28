import React from "react";
import BCGovLogo from "../../components/BCGovLogo";
import { Button, InlineNotification, NotificationActionButton } from "@carbon/react";
import { Login, Close } from "@carbon/icons-react";
import { useAuth } from "../../contexts/AuthProvider";
import "./Landing.scss";
import { useLottie } from "lottie-react";
import landingPageAnimation from "../../assets/lotties/silva-logo-lottie-1.json";

const Landing: React.FC = () => {
  const { login, authError } = useAuth();
  //define lottie options and loader
  const options = {
    animationData: landingPageAnimation,
    loop: true
  };
  const { View } = useLottie(options);

  const getErrorMessage = () => {
    switch (authError) {
      case 'AUTH_INFRASTRUCTURE_ERROR':
        return {
          title: 'Authentication Service Temporarily Unavailable',
          subtitle: 'The authentication service is experiencing technical difficulties. Please try again in a few minutes. If the problem persists, contact your system administrator.',
          kind: 'error' as const
        };
      case 'REDIRECT_URI_MISMATCH':
        return {
          title: 'Authentication Configuration Error',
          subtitle: 'There is a configuration issue with the authentication service. Please contact your system administrator.',
          kind: 'error' as const
        };
      case 'INVALID_GRANT':
        return {
          title: 'Authentication Session Expired',
          subtitle: 'Your authentication session has expired. Please try logging in again.',
          kind: 'warning' as const
        };
      default:
        return {
          title: 'Authentication Error',
          subtitle: 'An error occurred during authentication. Please try again.',
          kind: 'error' as const
        };
    }
  };

  const errorInfo = authError ? getErrorMessage() : null;

  return (
    <>
      <div className="container-fluid">
        {errorInfo && (
          <div className="row mb-4">
            <div className="col-12">
              <InlineNotification
                kind={errorInfo.kind}
                title={errorInfo.title}
                subtitle={errorInfo.subtitle}
                lowContrast
                onClose={() => {}}
              />
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-lg-7 px-4">
            <BCGovLogo />
            {/* Welcome - Title and Subtitle */}
            <h1 data-testid="landing-title" className="landing-title">
              Welcome to RESULTS EXAM
            </h1>
            <h2 data-testid="landing-subtitle" className="landing-subtitle">
              Login to take a RESULTS exam
            </h2>
            {/* Button Group */}
            <div className="row gy-3">
              <div className="col-xl-5 col-lg-6">
                <Button
                  onClick={() => login("idir")}
                  renderIcon={Login}
                  data-testid="landing-button__idir"
                  className="btn-landing"
                >
                  Login with IDIR
                </Button>
              </div>
              <div className="col-xl-5 col-lg-6 ">
                <Button
                  kind="tertiary"
                  onClick={() => {
                    login("bceid");
                  }}
                  renderIcon={Login}
                  data-testid="landing-button__bceid"
                  className="btn-landing"
                >
                  Login with Business BCeID
                </Button>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="lottie-container">{View}</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;
