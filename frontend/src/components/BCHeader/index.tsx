import React from "react";
import { Link } from "react-router-dom";
import BCGovLogo from "../BCGovLogo";
import "./BCHeader.scss";

const BCHeader: React.FC = () => {
  return (
    <header className="bc-gov-header" data-testid="header">
      <div className="bc-gov-header__container">
        <div className="bc-gov-header__branding">
          <BCGovLogo />
          <div className="bc-gov-header__text">
            <span className="bc-gov-header__british">BRITISH</span>
            <span className="bc-gov-header__columbia">COLUMBIA</span>
          </div>
        </div>
        <div className="bc-gov-header__separator"></div>
        <Link to="/" className="bc-gov-header__title" data-testid="header-name">
          RESULTS EXAM
        </Link>
      </div>
      <div className="bc-gov-header__border"></div>
    </header>
  );
};

export default BCHeader;
