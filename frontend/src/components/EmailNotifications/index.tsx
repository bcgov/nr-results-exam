// components/EmailNotification.tsx
import React from "react";
import { InlineNotification } from "@carbon/react";

interface EmailNotificationProps {
  emailStatus: "success" | "error" | null;
}

const EmailNotification: React.FC<EmailNotificationProps> = ({ emailStatus }) => {
  if (!emailStatus) return null;

  return (
    <InlineNotification
      subtitle={
        emailStatus === "success"
          ? "Email report sent successfully. You can close this browser window now."
          : "Failed to send the email report. Please take a screenshot of your results."
      }
      title={<span className="fw-bold">{emailStatus === "success" ? "Success" : "Error"}</span>}
      kind={emailStatus}
      lowContrast
      className="w-100"
    />
  );
};

export default EmailNotification;
