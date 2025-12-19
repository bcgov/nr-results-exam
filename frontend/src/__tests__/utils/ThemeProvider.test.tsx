import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ThemeProvider, { useTheme } from "../../utils/ThemeProvider";

const ThemeConsumer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      data-testid="theme-provider-value"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      {theme}
    </button>
  );
};

const renderWithProvider = (element?: React.ReactElement) =>
  render(<ThemeProvider>{element ?? <ThemeConsumer />}</ThemeProvider>);

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  test("reads initial theme from localStorage", async () => {
    localStorage.setItem("theme", "light");

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("theme-provider-value")).toHaveTextContent("light");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("persists theme updates", async () => {
    renderWithProvider();

    const toggle = screen.getByTestId("theme-provider-value");

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveTextContent("light");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });
});

