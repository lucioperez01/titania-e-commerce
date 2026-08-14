import { NextRequest, NextResponse } from "next/server";

// Mock next-auth/jwt
jest.mock("next-auth/jwt", () => ({
  getToken: jest.fn(),
}));

// Mock NEXTAUTH_SECRET
const originalEnv = process.env;

describe("middleware", () => {
  let middleware: typeof import("../../middleware");

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv, NEXTAUTH_SECRET: "test-secret" };
    middleware = await import("../../middleware");
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

  it("should allow non-dashboard routes", async () => {
    const { getToken } = require("next-auth/jwt");
    getToken.mockResolvedValue(null);

    const response = await middleware.middleware(makeRequest("/shop"));

    expect(response.status).toBe(200); // NextResponse.next() returns 200
  });

  it("should redirect unauthenticated users to login", async () => {
    const { getToken } = require("next-auth/jwt");
    getToken.mockResolvedValue(null);

    const response = await middleware.middleware(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toContain("/login");
  });

  it("should redirect non-admin users to home", async () => {
    const { getToken } = require("next-auth/jwt");
    getToken.mockResolvedValue({ userId: "1", role: "USER" });

    const response = await middleware.middleware(makeRequest("/dashboard"));

    expect(response.headers.get("location")).toContain("/");
  });

  it("should allow admin users to access dashboard", async () => {
    const { getToken } = require("next-auth/jwt");
    getToken.mockResolvedValue({ userId: "1", role: "ADMIN" });

    const response = await middleware.middleware(makeRequest("/dashboard"));

    expect(response.status).toBe(200); // NextResponse.next()
  });

  it("should protect nested dashboard routes", async () => {
    const { getToken } = require("next-auth/jwt");
    getToken.mockResolvedValue(null);

    const response = await middleware.middleware(makeRequest("/dashboard/products"));

    expect(response.headers.get("location")).toContain("/login");
  });
});
