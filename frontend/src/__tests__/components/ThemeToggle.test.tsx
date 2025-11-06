import React from "react";
import ThemeToggle from "../../components/ThemeToggle";
import {describe, expect, it, vi, beforeAll} from "vitest";
import {fireEvent, render, screen} from "@testing-library/react";
import { ThemePreference } from "../../utils/ThemePreference";

beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

const renderComponent = () => {
    render(
        <ThemePreference>
            <ThemeToggle />
        </ThemePreference>
    ); }

describe('ThemeToggle', () => {
    it('should render the component', () => {
        renderComponent();
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();

    });
    it('should call the toggle function when clicked, and the class should now have the text on', () => {
        renderComponent();
        screen.getByTestId('theme-toggle');
        // fireEvent is used to simulate the click event
        fireEvent.click(screen.getByTestId('theme-toggle'));
        // check if the class contains on, as the theme is toggled. Earlier it was off
        // initially the theme-toggle div will containg className="theme-toggle off"
        // after the click, it should contain className="theme-toggle on"
        expect(screen.getByTestId('theme-toggle').classList.toString()).toContain('on');
    });
}); 