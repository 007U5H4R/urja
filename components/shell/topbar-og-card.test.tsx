// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { hidesTopBar } from "./nav";
import { TopBar } from "./TopBar";

afterEach(cleanup);

describe("TopBar on /og-card (technical-plan §9)", () => {
  it("hidesTopBar: the phone screens and the OG card, nothing else", () => {
    expect(["/og-card", "/og-card/", "/brief", "/message"].map(hidesTopBar)).toEqual([true, true, true, true]);
    expect(["/", "/why", "/trips/0926-04", "/og-cardx", "/og-card/x"].map(hidesTopBar)).toEqual([false, false, false, false, false]);
  });

  it("renders nothing on the link-preview card", () => {
    pathname = "/og-card";
    const { container } = render(<TopBar fleetName="Sharma Roadlines" truckCount={24} />);
    expect(container.innerHTML).toBe("");
  });

  it.each(["/", "/why", "/trips/0926-04", "/og-cardx"])("still renders on %s", (p) => {
    pathname = p;
    const { container } = render(<TopBar fleetName="Sharma Roadlines" truckCount={24} />);
    expect(container.querySelector("header.topbar")).not.toBeNull();
  });
});
