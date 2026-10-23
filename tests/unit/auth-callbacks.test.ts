/**
 * Unit tests for Auth.js callbacks in lib/auth.ts.
 *
 * Tests jwt, session, and signIn callbacks by mocking next-auth
 * to capture the config, then invoking each callback directly.
 *
 * Covers:
 * - JWT callback: userId, role, email propagation; update trigger
 * - Session callback: token → session.user field mapping
 * - SignIn callback: ADMIN_EMAIL auto-promotion, Google OAuth user creation/linking
 */

// --- Mocks (hoisted by Jest before imports) ---

let capturedConfig: any = {};

jest.mock("next-auth", () => ({
  __esModule: true,
  default: (config: any) => {
    capturedConfig = config;
    return {
      handlers: { GET: jest.fn(), POST: jest.fn() },
      signIn: jest.fn(),
      signOut: jest.fn(),
      auth: jest.fn(),
    };
  },
}));

jest.mock("@/auth.config", () => ({
  authConfig: {
    providers: [],
    pages: { signIn: "/login" },
  },
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: mockPrisma,
}));

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: { compare: jest.fn() },
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn((opts: any) => ({ id: "credentials", ...opts })),
}));

// --- Import lib/auth to trigger NextAuth() and capture config ---
import "@/lib/auth";

describe("Auth.js callbacks (lib/auth.ts)", () => {
  let jwtCallback: (args: {
    token: any;
    user?: any;
    trigger?: string;
    session?: any;
  }) => Promise<any>;
  let sessionCallback: (args: {
    session: any;
    token: any;
  }) => Promise<any>;
  let signInCallback: (args: {
    user: any;
    account?: any;
  }) => Promise<boolean>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@titania.com";

    jwtCallback = capturedConfig.callbacks.jwt;
    sessionCallback = capturedConfig.callbacks.session;
    signInCallback = capturedConfig.callbacks.signIn;
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
  });

  // ===================== JWT Callback =====================

  describe("jwt callback", () => {
    it("sets userId, role, and email on token when user is present", async () => {
      const token: any = {};
      const user = { id: "user-1", email: "test@example.com", role: "ADMIN" };

      const result = await jwtCallback({ token, user });

      expect(result.userId).toBe("user-1");
      expect(result.role).toBe("ADMIN");
      expect(result.email).toBe("test@example.com");
    });

    it("defaults role to USER when user has no role property", async () => {
      const token: any = {};
      const user = { id: "user-2", email: "norole@example.com" };

      const result = await jwtCallback({ token, user });

      expect(result.userId).toBe("user-2");
      expect(result.role).toBe("USER");
      expect(result.email).toBe("norole@example.com");
    });

    it("preserves existing token fields when user is absent (subsequent requests)", async () => {
      const token: any = {
        userId: "existing-id",
        role: "ADMIN",
        email: "existing@example.com",
      };

      const result = await jwtCallback({ token, user: undefined });

      expect(result.userId).toBe("existing-id");
      expect(result.role).toBe("ADMIN");
      expect(result.email).toBe("existing@example.com");
    });

    it("updates role on trigger='update' when session provides a new role", async () => {
      const token: any = {
        userId: "user-1",
        role: "USER",
        email: "test@example.com",
      };

      const result = await jwtCallback({
        token,
        trigger: "update",
        session: { role: "ADMIN" },
      });

      expect(result.role).toBe("ADMIN");
      // userId and email should be preserved from existing token
      expect(result.userId).toBe("user-1");
      expect(result.email).toBe("test@example.com");
    });

    it("keeps existing role on trigger='update' when session has no role", async () => {
      const token: any = {
        userId: "user-1",
        role: "USER",
        email: "test@example.com",
      };

      const result = await jwtCallback({
        token,
        trigger: "update",
        session: {},
      });

      expect(result.role).toBe("USER");
    });
  });

  // ===================== Session Callback =====================

  describe("session callback", () => {
    it("exposes userId, role, and email from token to session.user", async () => {
      const session: any = { user: {} };
      const token = {
        userId: "user-1",
        role: "ADMIN",
        email: "admin@example.com",
      };

      const result = await sessionCallback({ session, token });

      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBe("ADMIN");
      expect(result.user.email).toBe("admin@example.com");
    });

    it("does not set id when token.userId is absent", async () => {
      const session: any = { user: { email: "test@example.com" } };
      const token = { role: "USER", email: "test@example.com" };

      const result = await sessionCallback({ session, token });

      expect(result.user.id).toBeUndefined();
      expect(result.user.role).toBe("USER");
    });

    it("does not set role when token has no role", async () => {
      const session: any = { user: {} };
      const token = { userId: "user-1", email: "test@example.com" };

      const result = await sessionCallback({ session, token });

      expect(result.user.id).toBe("user-1");
      expect(result.user.role).toBeUndefined();
    });

    it("preserves existing session fields not overwritten by token", async () => {
      const session: any = { user: { name: "Test User", image: "pic.jpg" } };
      const token = {
        userId: "user-1",
        role: "USER",
        email: "test@example.com",
      };

      const result = await sessionCallback({ session, token });

      expect(result.user.name).toBe("Test User");
      expect(result.user.image).toBe("pic.jpg");
      expect(result.user.id).toBe("user-1");
    });
  });

  // ===================== SignIn Callback =====================

  describe("signIn callback", () => {
    describe("admin auto-promotion (credentials + OAuth)", () => {
      it("promotes user to ADMIN when email matches ADMIN_EMAIL", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          email: "admin@titania.com",
          role: "USER",
        });
        mockPrisma.user.update.mockResolvedValue({
          id: 1,
          role: "ADMIN",
        });

        const result = await signInCallback({
          user: { email: "admin@titania.com" },
          account: { provider: "credentials" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { email: "admin@titania.com" },
        });
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { role: "ADMIN" },
        });
      });

      it("does NOT call update when user is already ADMIN", async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          email: "admin@titania.com",
          role: "ADMIN",
        });

        const result = await signInCallback({
          user: { email: "admin@titania.com" },
          account: { provider: "credentials" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it("does NOT promote when email does not match ADMIN_EMAIL", async () => {
        const result = await signInCallback({
          user: { email: "regular@example.com" },
          account: { provider: "credentials" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it("supports multiple admin emails (comma-separated)", async () => {
        process.env.ADMIN_EMAIL = "admin@titania.com,cto@titania.com";

        mockPrisma.user.findUnique.mockResolvedValue({
          id: 2,
          email: "cto@titania.com",
          role: "USER",
        });
        mockPrisma.user.update.mockResolvedValue({ id: 2, role: "ADMIN" });

        const result = await signInCallback({
          user: { email: "cto@titania.com" },
          account: { provider: "credentials" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 2 },
          data: { role: "ADMIN" },
        });
      });

      it("returns true and skips DB when user has no email", async () => {
        const result = await signInCallback({
          user: { email: null },
          account: { provider: "credentials" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      });
    });

    describe("Google OAuth — link or create user", () => {
      it("returns true without creating user when existing user found (linking)", async () => {
        // non-admin email → admin check skipped (no findUnique)
        // google provider → findUnique returns existing user
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 1,
          email: "existing@gmail.com",
          role: "USER",
        });

        const result = await signInCallback({
          user: { email: "existing@gmail.com", name: "Existing User" },
          account: { provider: "google" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.create).not.toHaveBeenCalled();
      });

      it("creates new USER when no existing user found for Google OAuth", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 10,
          email: "new@gmail.com",
          role: "USER",
        });

        const result = await signInCallback({
          user: { email: "new@gmail.com", name: "John Doe" },
          account: { provider: "google" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: {
            email: "new@gmail.com",
            firstName: "John",
            lastName: "Doe",
            role: "USER",
            passwordHash: null,
          },
        });
      });

      it("creates new ADMIN when Google user matches ADMIN_EMAIL", async () => {
        // admin email → admin check calls findUnique (returns null, no update)
        // google check calls findUnique again (returns null) → create with ADMIN
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 11,
          email: "admin@titania.com",
          role: "ADMIN",
        });

        const result = await signInCallback({
          user: { email: "admin@titania.com", name: "Admin User" },
          account: { provider: "google" },
        });

        expect(result).toBe(true);
        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: "admin@titania.com",
            role: "ADMIN",
          }),
        });
      });

      it("handles single-word name (no last name) correctly", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 12,
          email: "single@gmail.com",
          role: "USER",
        });

        await signInCallback({
          user: { email: "single@gmail.com", name: "Mononym" },
          account: { provider: "google" },
        });

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: "Mononym",
            lastName: null,
          }),
        });
      });

      it("handles multi-word last name correctly", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 13,
          email: "compound@gmail.com",
          role: "USER",
        });

        await signInCallback({
          user: { email: "compound@gmail.com", name: "Maria del Carmen Lopez" },
          account: { provider: "google" },
        });

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: "Maria",
            lastName: "del Carmen Lopez",
          }),
        });
      });

      it("handles missing name (null) gracefully", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: 14,
          email: "noname@gmail.com",
          role: "USER",
        });

        await signInCallback({
          user: { email: "noname@gmail.com", name: null },
          account: { provider: "google" },
        });

        expect(mockPrisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: null,
            lastName: null,
          }),
        });
      });
    });
  });
});
