import { describe, expect, it } from "vitest";

import manifest from "../../app/manifest";

describe("PWA manifest", () => {
  it("defines a scoped standalone Atlas installation", () => {
    const value = manifest();

    expect(value.name).toBe("Atlas Creed");
    expect(value.start_url).toBe("/");
    expect(value.scope).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toBe("#09090d");
    expect(value.background_color).toBe("#09090d");
  });

  it("provides regular and maskable icons", () => {
    const purposes = manifest().icons?.map((icon) => icon.purpose);
    expect(purposes).toContain("any");
    expect(purposes).toContain("maskable");
  });
});
