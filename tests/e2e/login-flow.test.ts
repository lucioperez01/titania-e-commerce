/**
 * E2E-style tests for the login flow.
 *
 * Tests the login server actions (loginAction, googleSignIn) end-to-end:
 * - Credentials login with callbackUrl → correct redirect
 * - Google OAuth login with callbackUrl
 * - Role-based redirect fallback (ADMIN → /dashboard, USER → /)
 * - Error handling for invalid credentials
 *
 * These tests mock @/lib/auth (signIn, auth) and verify the action logic
 * in app/(store)/login/actions.ts.
 */

// --- Mocks ---

jest.mock("@/lib/auth", () => ({
  __esModule: true,
  signIn: jest.fn(),
  auth: jest.fn(),
}));

import { loginAction, googleSignIn } from "@/app/(store)/login/actions";

describe("Login flow (E2E actions)", () => {
  let mockSignIn: jest.Mock;
  let mockAuth: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const authModule = require("@/lib/auth");
    mockSignIn = authModule.signIn;
    mockAuth = authModule.auth;
  });

  // Helper to build FormData
  const buildFormData = (fields: Record<string, string>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    return formData;
  };

  // ===================== Credentials Login =====================

  describe("loginAction (credentials)", () => {
    it("redirects to callbackUrl when provided and login succeeds", async () => {
      mockSignIn.mockResolvedValue({ url: "/dashboard" });
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      });

      const formData = buildFormData({
        email: "admin@titania.com",
        password: "secret123",
        callbackUrl: "/dashboard",
      });

      const result = await loginAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.callbackUrl).toBe("/dashboard");
      expect(result.role).toBe("ADMIN");
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "admin@titania.com",
        password: "secret123",
        redirect: false,
        callbackUrl: "/dashboard",
      });
    });

    it("redirects ADMIN to /dashboard when no callbackUrl (role-based fallback)", async () => {
      mockSignIn.mockResolvedValue({ url: "/" });
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "ADMIN", email: "admin@titania.com" },
      });

      const formData = buildFormData({
        email: "admin@titania.com",
        password: "secret123",
      });

      const result = await loginAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.callbackUrl).toBe("/dashboard");
      expect(result.role).toBe("ADMIN");
    });

    it("redirects USER to / when no callbackUrl (role-based fallback)", async () => {
      mockSignIn.mockResolvedValue({ url: "/" });
      mockAuth.mockResolvedValue({
        user: { id: "2", role: "USER", email: "user@example.com" },
      });

      const formData = buildFormData({
        email: "user@example.com",
        password: "secret123",
      });

      const result = await loginAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.callbackUrl).toBe("/");
      expect(result.role).toBe("USER");
    });

    it("returns error when signIn returns an error object", async () => {
      mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

      const formData = buildFormData({
        email: "wrong@example.com",
        password: "badpassword",
      });

      const result = await loginAction(null, formData);

      expect(result.error).toBe("Credenciales inválidas");
      expect(result.success).toBeUndefined();
    });

    it("returns error when signIn throws CredentialsSignin", async () => {
      mockSignIn.mockRejectedValue(new Error("CredentialsSignin"));

      const formData = buildFormData({
        email: "wrong@example.com",
        password: "badpassword",
      });

      const result = await loginAction(null, formData);

      expect(result.error).toBe("Credenciales inválidas");
    });

    it("returns generic error for non-credential failures", async () => {
      mockSignIn.mockRejectedValue(new Error("Database connection failed"));

      const formData = buildFormData({
        email: "admin@titania.com",
        password: "secret123",
      });

      const result = await loginAction(null, formData);

      expect(result.error).toBe("Error al iniciar sesión");
    });

    it("passes undefined callbackUrl to signIn when field is empty", async () => {
      mockSignIn.mockResolvedValue({ url: "/" });
      mockAuth.mockResolvedValue({
        user: { id: "1", role: "ADMIN" },
      });

      const formData = buildFormData({
        email: "admin@titania.com",
        password: "secret123",
        callbackUrl: "",
      });

      await loginAction(null, formData);

      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "admin@titania.com",
        password: "secret123",
        redirect: false,
        callbackUrl: undefined,
      });
    });

    it("prefers callbackUrl over role-based fallback when both are available", async () => {
      mockSignIn.mockResolvedValue({ url: "/dashboard/products" });
      mockAuth.mockResolvedValue({
        user: { id: "2", role: "USER", email: "user@example.com" },
      });

      const formData = buildFormData({
        email: "user@example.com",
        password: "secret123",
        callbackUrl: "/dashboard/products",
      });

      const result = await loginAction(null, formData);

      // callbackUrl is preferred even though USER would normally go to /
      expect(result.callbackUrl).toBe("/dashboard/products");
    });
  });

  // ===================== Google OAuth Login =====================

  describe("googleSignIn (OAuth)", () => {
    it("calls signIn('google') with callbackUrl when provided", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const formData = buildFormData({
        callbackUrl: "/dashboard",
      });

      await googleSignIn(formData);

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard",
      });
    });

    it("passes undefined callbackUrl when field is empty", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const formData = buildFormData({
        callbackUrl: "",
      });

      await googleSignIn(formData);

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: undefined,
      });
    });

    it("passes undefined callbackUrl when field is missing from formData", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const formData = new FormData();
      // No callbackUrl field at all

      await googleSignIn(formData);

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: undefined,
      });
    });

    it("propagates callbackUrl for nested dashboard routes", async () => {
      mockSignIn.mockResolvedValue(undefined);

      const formData = buildFormData({
        callbackUrl: "/dashboard/create-product",
      });

      await googleSignIn(formData);

      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/dashboard/create-product",
      });
    });
  });
});
