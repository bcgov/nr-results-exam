import React from "react";
import BCGovLogo from "../../components/BCGovLogo";
import { Button } from "@carbon/react";
import { Login } from "@carbon/icons-react";
import { useAuth } from "../../contexts/AuthProvider";
import "./Landing.scss";
import { useLottie } from "lottie-react";
import landingPageAnimation from "../../assets/lotties/silva-logo-lottie-1.json";

const Landing: React.FC = () => {
  const { login } = useAuth();
  //define lottie options and loader
  const options = {
    animationData: landingPageAnimation,
    loop: true,
  };
  const { View } = useLottie(options);

  return (
    <>
      <div className="container-fluid">
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
