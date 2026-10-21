import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import nextConfig from "@/next.config";

describe("PWA manifest", () => {
  it("matches DESIGN and has 192 and 512 icons", () => {
    const m = manifest();
    expect(m).toMatchObject({
      name: "מחולל בדיחות",
      short_name: "בדיחות",
      start_url: "/",
      display: "standalone",
      lang: "he",
      dir: "rtl",
      theme_color: "#FFD400",
      background_color: "#FFFFFF",
    });
    expect(m.icons?.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
    expect(m.icons?.every((icon) => icon.type === "image/png")).toBe(true);
  });
});

describe("security headers", () => {
  it("applies the ARCHITECTURE 2.4 headers to every path", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    expect(Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value]))).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
  });
});
