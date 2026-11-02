import { NextRequest } from "next/server";

// Mock @/lib/auth (Auth.js v5 pattern)
// auth() wraps a handler: auth(handler) => (req) => handler({ ...req, auth })
const mockAuthState: { auth: { user: { role: string } } | null } = {
  auth: null,
};

jest.mock("@/lib/auth", () => ({
  auth: (handler: (req: any) => any) =>
    (req: any) => handler({ ...req, auth: mockAuthState.auth }),
}));

const originalEnv = process.env;

describe("middleware", () => {
  let middleware: typeof import("../../proxy");

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv, NEXTAUTH_SECRET: "test-secret" };
    mockAuthState.auth = null;
    middleware = await import("../../proxy");
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  const makeRequest = (pathname: string) => {
    return {
      nextUrl: new URL(`http://localhost:3000${pathname}`),
      url: "http://localhost:3000",
    } as unknown as NextRequest;
  };

  it("should allow non-dashboard routes when authenticated", async () => {
    mockAuthState.auth = { user: { role: "ADMIN" } };

    const response = await middleware.default(makeRequest("/shop"));

    expect(response.status).toBe(200); // NextResponse.next() returns 200
  });

  it("should redirect unauthenticated users to login", async () => {
    mockAuthState.auth = null;

    const response = await middleware.default(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toContain("/login");
  });

  it("should redirect non-admin users to home", async () => {
    mockAuthState.auth = { user: { role: "USER" } };

    const response = await middleware.default(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toContain("/");
  });

  it("should allow admin users to access dashboard", async () => {
    mockAuthState.auth = { user: { role: "ADMIN" } };

    const response = await middleware.default(makeRequest("/dashboard"));

    expect(response.status).toBe(200); // NextResponse.next()
  });

  it("should protect nested dashboard routes", async () => {
    mockAuthState.auth = null;

    const response = await middleware.default(makeRequest("/dashboard/products"));

    expect(response.headers.get("location")).toContain("/login");
  });
});
