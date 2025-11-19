import { beforeEach, describe, expect, test, vi } from "vitest";

describe("env runtime configuration extraction", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  test("merges data attributes into env when values are present", async () => {
    document.body.innerHTML = `
      <div
        id="root"
        data-vite-client-id='client-id'
        data-vite-pool-id='pool-id'
        data-vite-zone='ZONE'
      ></div>
    `;

    const { env } = await import("../env");

    expect(env.VITE_USER_POOLS_WEB_CLIENT_ID).toBe("client-id");
    expect(env.VITE_USER_POOLS_ID).toBe("pool-id");
    expect(env.VITE_ZONE).toBe("ZONE");
  });

  test("returns import meta values when data attributes contain unresolved placeholders", async () => {
    document.body.innerHTML = `
      <div
        id="root"
        data-vite-client-id='{{env "VITE_USER_POOLS_WEB_CLIENT_ID"}}'
        data-vite-pool-id='{{env "VITE_USER_POOLS_ID"}}'
        data-vite-zone='{{env "VITE_ZONE"}}'
      ></div>
    `;

    const { env } = await import("../env");

    expect(env.VITE_USER_POOLS_WEB_CLIENT_ID).toBeUndefined();
    expect(env.VITE_USER_POOLS_ID).toBeUndefined();
    expect(env.VITE_ZONE).toBeUndefined();
  });
});
