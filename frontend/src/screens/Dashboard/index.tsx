import React from "react";
import StandardCard from "../../components/StandardCard";
import { useAuth } from "../../contexts/AuthProvider";
import { Loading } from "@carbon/react";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  return user ? (
    <>
      <div className="container">
        <h4 className="py-4">
          Hello{" "}
          <span className="fw-bold">
            {user.firstName + " " + user.lastName}
          </span>
          , welcome to the RESULTS EXAM portal. Please take a moment to review
          the available options and select the test that best matches your
          access requirements:
        </h4>
        <div className="row justify-content-center">
          <div className="col-md-6 col-xl-4" data-testid="card-a">
            <StandardCard
              header="Test A: Declaration and Update"
              description=" This test is for individuals entering data for timber licenses, whether creating new openings or updating existing ones."
              url="/testA"
              image="ChartCustom"
            />
          </div>
          <div className="col-md-6 col-xl-4" data-testid="card-b">
            <StandardCard
              header="Test B: Approvals"
              description="This test is for district staff responsible for approving FRPA 108, amalgamations, and amendments requiring district manager approval."
              url="/testB"
              image="ChartCustom"
            />
          </div>
          <div className="col-md-6 col-xl-4" data-testid="card-c">
            <StandardCard
              header="Test C: Woodlots and Community Forests Management"
              description="This test is for woodlot owners and community forests entering data for timber licenses in line with approved site plans."
              url="/testC"
              image="ChartCustom"
            />
          </div>
        </div>
      </div>
    </>
  ) : (
    <Loading description="Loading..." withOverlay={true} />
  );
};

export default Dashboard;
