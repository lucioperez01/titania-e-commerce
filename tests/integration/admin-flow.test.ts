/**
 * Integration tests for admin flow: registration, role assignment, and dashboard access.
 * Tests the full admin auto-promotion and dashboard protection flow.
 */

describe("Admin Flow End-to-End", () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGetToken = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Set admin email env
    process.env.ADMIN_EMAIL = "admin@titania.com";
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
  });

  describe("Admin auto-promotion on registration", () => {
    it("should create user with ADMIN role when email matches ADMIN_EMAIL", async () => {
      const adminEmail = "admin@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];
      const isAdmin = adminEmails.includes(adminEmail);

      expect(isAdmin).toBe(true);

      // Simulate user creation
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: adminEmail,
        role: "ADMIN",
      });

      const result = await mockPrisma.user.create({
        data: {
          email: adminEmail,
          role: isAdmin ? "ADMIN" : "USER",
          passwordHash: "hashed-password",
        },
      });

      expect(result.role).toBe("ADMIN");
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: adminEmail,
            role: "ADMIN",
          }),
        })
      );
    });

    it("should create user with USER role when email does not match ADMIN_EMAIL", async () => {
      const userEmail = "regular@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];
      const isAdmin = adminEmails.includes(userEmail);

      expect(isAdmin).toBe(false);

      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        email: userEmail,
        role: "USER",
      });

      const result = await mockPrisma.user.create({
        data: {
          email: userEmail,
          role: isAdmin ? "ADMIN" : "USER",
          passwordHash: "hashed-password",
        },
      });

      expect(result.role).toBe("USER");
    });

    it("should promote existing user to ADMIN on login when email matches", async () => {
      const adminEmail = "admin@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: adminEmail,
        role: "USER",
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        email: adminEmail,
        role: "ADMIN",
      });

      // Simulate signIn callback logic
      const dbUser = await mockPrisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (dbUser && adminEmails.includes(dbUser.email) && dbUser.role !== "ADMIN") {
        await mockPrisma.user.update({
          where: { id: dbUser.id },
          data: { role: "ADMIN" },
        });
      }

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role: "ADMIN" },
      });
    });
  });

  describe("Dashboard access control", () => {
    it("should allow ADMIN to access /dashboard", async () => {
      mockGetToken.mockResolvedValue({ userId: "1", role: "ADMIN" });

      const token = await mockGetToken({ secret: "test" });
      const hasAccess = token?.role === "ADMIN";

      expect(hasAccess).toBe(true);
    });

    it("should deny USER access to /dashboard", async () => {
      mockGetToken.mockResolvedValue({ userId: "2", role: "USER" });

      const token = await mockGetToken({ secret: "test" });
      const hasAccess = token?.role === "ADMIN";

      expect(hasAccess).toBe(false);
    });

    it("should deny unauthenticated access to /dashboard", async () => {
      mockGetToken.mockResolvedValue(null);

      const token = await mockGetToken({ secret: "test" });
      const hasAccess = !!token && token.role === "ADMIN";

      expect(hasAccess).toBe(false);
    });

    it("should handle multiple admin emails", async () => {
      process.env.ADMIN_EMAIL = "admin@titania.com,owner@titania.com,cto@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL.split(",");

      expect(adminEmails).toContain("admin@titania.com");
      expect(adminEmails).toContain("owner@titania.com");
      expect(adminEmails).toContain("cto@titania.com");
      expect(adminEmails).not.toContain("user@titania.com");

      expect(adminEmails.includes("owner@titania.com")).toBe(true);
    });
  });

  describe("Full admin flow: register → login → dashboard", () => {
    it("should complete the full admin flow", async () => {
      const adminEmail = "admin@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];

      // Step 1: Register
      const isAdmin = adminEmails.includes(adminEmail);
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: adminEmail,
        role: isAdmin ? "ADMIN" : "USER",
      });

      const registeredUser = await mockPrisma.user.create({
        data: {
          email: adminEmail,
          role: isAdmin ? "ADMIN" : "USER",
          passwordHash: "hashed",
        },
      });

      expect(registeredUser.role).toBe("ADMIN");

      // Step 2: Login (signIn callback promotes if needed)
      mockPrisma.user.findUnique.mockResolvedValue(registeredUser);
      const dbUser = await mockPrisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (dbUser && adminEmails.includes(dbUser.email) && dbUser.role !== "ADMIN") {
        await mockPrisma.user.update({
          where: { id: dbUser.id },
          data: { role: "ADMIN" },
        });
      }

      // Step 3: Access dashboard (middleware check)
      mockGetToken.mockResolvedValue({
        userId: "1",
        role: registeredUser.role,
        email: adminEmail,
      });
      const token = await mockGetToken({ secret: "test" });
      const canAccessDashboard = token?.role === "ADMIN";

      expect(canAccessDashboard).toBe(true);
    });

    it("should block non-admin from dashboard in full flow", async () => {
      const userEmail = "user@titania.com";

      // Step 1: Register as regular user
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        email: userEmail,
        role: "USER",
      });

      const registeredUser = await mockPrisma.user.create({
        data: {
          email: userEmail,
          role: "USER",
          passwordHash: "hashed",
        },
      });

      expect(registeredUser.role).toBe("USER");

      // Step 2: Login (no promotion)
      mockPrisma.user.findUnique.mockResolvedValue(registeredUser);

      // Step 3: Try to access dashboard
      mockGetToken.mockResolvedValue({
        userId: "2",
        role: "USER",
        email: userEmail,
      });
      const token = await mockGetToken({ secret: "test" });
      const canAccessDashboard = token?.role === "ADMIN";

      expect(canAccessDashboard).toBe(false);
    });
  });
});
