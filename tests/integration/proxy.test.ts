/**
 * Integration tests for proxy.ts middleware.
 *
 * Tests the auth() wrapper middleware that protects /dashboard/* routes.
 * Mocks @/lib/auth to provide a controllable session, then verifies:
 * - Unauthenticated → redirect to /login?callbackUrl=<path>
 * - Authenticated USER → redirect to /
 * - Authenticated ADMIN → NextResponse.next() (passthrough)
 *
 * Also verifies the matcher config and callbackUrl encoding.
 */

// Mock @/lib/auth — auth() wrapper becomes controllable
jest.mock("@/lib/auth", () => ({
  __esModule: true,
  auth: (handler: any) => (req: any) => {
    // Simulate auth() session resolution from cookies
    req.auth = (globalThis as any).__testSession;
    return handler(req);
  },
}));

import proxyMiddleware, { config } from "../../proxy";

describe("proxy.ts middleware (integration)", () => {
  beforeEach(() => {
    (globalThis as any).__testSession = undefined;
  });

  afterEach(() => {
    delete (globalThis as any).__testSession;
  });

  const makeRequest = (pathname: string) =>
    ({
      nextUrl: new URL(`http://localhost:3000${pathname}`),
      url: "http://localhost:3000",
    }) as any;

  // ===================== Matcher Config =====================

  describe("config", () => {
    it("matches only /dashboard/:path* routes", () => {
      expect(config.matcher).toEqual(["/dashboard/:path*"]);
    });
  });

  // ===================== Unauthenticated =====================

  describe("unauthenticated user (no session)", () => {
    it("redirects to /login with callbackUrl for /dashboard", async () => {
      (globalThis as any).__testSession = null;
      const req = makeRequest("/dashboard");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard");
    });

    it("redirects to /login with callbackUrl for nested /dashboard/create-product", async () => {
      (globalThis as any).__testSession = null;
      const req = makeRequest("/dashboard/create-product");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard%2Fcreate-product");
    });

    it("redirects to /login for /dashboard/orders", async () => {
      (globalThis as any).__testSession = undefined;
      const req = makeRequest("/dashboard/orders");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/login");
      expect(location).toContain("callbackUrl=%2Fdashboard%2Forders");
    });
  });

  // ===================== Non-ADMIN =====================

  describe("authenticated USER role", () => {
    it("redirects to / (home) when role is USER", async () => {
      (globalThis as any).__testSession = {
        user: { id: "2", role: "USER", email: "user@example.com" },
      };
      const req = makeRequest("/dashboard");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/");
      // Should NOT redirect to /login — user IS authenticated
      expect(location).not.toContain("/login");
    });

    it("redirects to / for nested dashboard routes", async () => {
      (globalThis as any).__testSession = {
        user: { id: "2", role: "USER", email: "user@example.com" },
      };
      const req = makeRequest("/dashboard/products");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });

    it("redirects to / when role is missing from session", async () => {
      (globalThis as any).__testSession = {
        user: { id: "3", email: "norole@example.com" },
      };
      const req = makeRequest("/dashboard");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/");
    });
  });

  // ===================== ADMIN =====================

  describe("authenticated ADMIN role", () => {
    it("allows access to /dashboard (NextResponse.next)", async () => {
      (globalThis as any).__testSession = {
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      };
      const req = makeRequest("/dashboard");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(200);
    });

    it("allows access to /dashboard/create-product", async () => {
      (globalThis as any).__testSession = {
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      };
      const req = makeRequest("/dashboard/create-product");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(200);
    });

    it("allows access to /dashboard/products", async () => {
      (globalThis as any).__testSession = {
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      };
      const req = makeRequest("/dashboard/products");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(200);
    });

    it("allows access to deeply nested dashboard routes", async () => {
      (globalThis as any).__testSession = {
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      };
      const req = makeRequest("/dashboard/orders/123/details");

      const res = await proxyMiddleware(req);

      expect(res.status).toBe(200);
    });
  });
});
