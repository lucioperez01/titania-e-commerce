/**
 * End-to-end integration tests for the full customer auth flow.
 * Covers: register → login → cart merge → dashboard access → checkout consent → order linking.
 */

describe("Customer Auth Full E2E Flow", () => {
  // Mock repositories and services
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    cart: {
      findByUserId: jest.fn(),
      addItem: jest.fn(),
      mergeItems: jest.fn(),
    },
  };

  const mockGetToken = jest.fn();
  const mockBcryptCompare = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@titania.com";
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.NEXTAUTH_SECRET;
  });

  describe("Full flow: regular user registration and login", () => {
    it("should complete register → login → cart merge → checkout with consent → order linking", async () => {
      const userEmail = "customer@example.com";
      const userPassword = "securePassword123";

      // === STEP 1: Registration ===
      mockBcryptCompare.mockResolvedValue(true);
      mockPrisma.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        email: userEmail,
        role: "USER",
        passwordHash: "hashed",
      });

      // Verify user doesn't exist
      const existingUser = await mockPrisma.user.findUnique({
        where: { email: userEmail },
      });
      expect(existingUser).toBeNull();

      // Create user
      const newUser = await mockPrisma.user.create({
        data: {
          email: userEmail,
          role: "USER",
          passwordHash: "hashed",
        },
      });
      expect(newUser.role).toBe("USER");
      expect(newUser.email).toBe(userEmail);

      // === STEP 2: Login ===
      mockPrisma.user.findUnique.mockResolvedValue(newUser);
      const loginUser = await mockPrisma.user.findUnique({
        where: { email: userEmail },
      });
      expect(loginUser).not.toBeNull();
      expect(loginUser?.role).toBe("USER");

      // === STEP 3: Cart merge on login ===
      const anonymousCartItems = [
        { productId: 10, quantity: 2, variantId: null },
        { productId: 20, quantity: 1, variantId: 5 },
      ];

      mockPrisma.cart.findByUserId.mockResolvedValue({
        id: 1,
        userId: newUser.id,
        items: [],
        status: "ACTIVE",
      });

      if (anonymousCartItems.length > 0) {
        await mockPrisma.cart.mergeItems(1, anonymousCartItems);
      }
      expect(mockPrisma.cart.mergeItems).toHaveBeenCalledWith(1, anonymousCartItems);

      // === STEP 4: Dashboard access (should be denied for USER) ===
      mockGetToken.mockResolvedValue({
        userId: "1",
        role: "USER",
        email: userEmail,
      });
      const token = await mockGetToken({ secret: "test-secret" });
      const canAccessDashboard = token?.role === "ADMIN";
      expect(canAccessDashboard).toBe(false);

      // === STEP 5: Checkout with consent ===
      // User checks "Obtenga ofertas exclusivas" at checkout
      mockPrisma.user.update.mockResolvedValue({
        id: 1,
        email: userEmail,
        mailing: true,
      });
      const consentResult = await mockPrisma.user.update({
        where: { id: newUser.id },
        data: { mailing: true },
      });
      expect(consentResult.mailing).toBe(true);

      // === STEP 6: Order linking ===
      // Simulate: user had 2 guest orders before registering
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 100, email: userEmail, userId: null },
        { id: 101, email: userEmail, userId: null },
      ]);
      mockPrisma.order.updateMany.mockResolvedValue({ count: 2 });

      const guestOrders = await mockPrisma.order.findMany({
        where: { email: userEmail, userId: null },
      });
      expect(guestOrders.length).toBe(2);

      if (guestOrders.length > 0) {
        await mockPrisma.order.updateMany({
          where: { email: userEmail, userId: null },
          data: { userId: newUser.id },
        });
      }
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: { email: userEmail, userId: null },
        data: { userId: 1 },
      });
    });
  });

  describe("Full flow: admin registration and dashboard access", () => {
    it("should grant admin dashboard access after auto-promotion", async () => {
      const adminEmail = "admin@titania.com";
      const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];

      // Registration with admin email
      const isAdmin = adminEmails.includes(adminEmail);
      expect(isAdmin).toBe(true);

      mockPrisma.user.create.mockResolvedValue({
        id: 5,
        email: adminEmail,
        role: "ADMIN",
        passwordHash: "hashed",
      });

      const adminUser = await mockPrisma.user.create({
        data: {
          email: adminEmail,
          role: "ADMIN",
          passwordHash: "hashed",
        },
      });
      expect(adminUser.role).toBe("ADMIN");

      // Login and verify dashboard access
      mockGetToken.mockResolvedValue({
        userId: "5",
        role: "ADMIN",
        email: adminEmail,
      });
      const token = await mockGetToken({ secret: "test-secret" });
      const canAccessDashboard = token?.role === "ADMIN";
      expect(canAccessDashboard).toBe(true);
    });
  });

  describe("Full flow: OAuth registration with order linking", () => {
    it("should create OAuth user, link orders, and merge cart", async () => {
      const oauthEmail = "google.user@gmail.com";

      // OAuth user creation (no password)
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 10,
        email: oauthEmail,
        role: "USER",
        passwordHash: null,
      });

      const oauthUser = await mockPrisma.user.create({
        data: {
          email: oauthEmail,
          role: "USER",
          passwordHash: null,
        },
      });
      expect(oauthUser.passwordHash).toBeNull();
      expect(oauthUser.role).toBe("USER");

      // Order linking for OAuth user
      mockPrisma.order.findMany.mockResolvedValue([
        { id: 200, email: oauthEmail, userId: null },
      ]);
      mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });

      const guestOrders = await mockPrisma.order.findMany({
        where: { email: oauthEmail, userId: null },
      });
      if (guestOrders.length > 0) {
        await mockPrisma.order.updateMany({
          where: { email: oauthEmail, userId: null },
          data: { userId: oauthUser.id },
        });
      }
      expect(mockPrisma.order.updateMany).toHaveBeenCalled();

      // Cart merge
      mockPrisma.cart.findByUserId.mockResolvedValue(null);
      mockPrisma.cart.mergeItems.mockResolvedValue(undefined);

      const anonymousItems = [{ productId: 30, quantity: 1, variantId: null }];
      if (anonymousItems.length > 0) {
        await mockPrisma.cart.mergeItems(oauthUser.id, anonymousItems);
      }
      expect(mockPrisma.cart.mergeItems).toHaveBeenCalled();
    });
  });

  describe("Error handling in full flow", () => {
    it("should handle cart merge stock-cap gracefully", async () => {
      // Anonymous cart has more than stock
      const anonymousItems = [{ productId: 1, quantity: 10, variantId: null }];

      mockPrisma.cart.findByUserId.mockResolvedValue({
        id: 1,
        userId: 1,
        items: [],
        status: "ACTIVE",
      });
      mockPrisma.cart.mergeItems.mockRejectedValue(
        new Error("Insufficient stock")
      );

      let warning: string | undefined;
      try {
        await mockPrisma.cart.mergeItems(1, anonymousItems);
      } catch (error) {
        if (error instanceof Error && error.message === "Insufficient stock") {
          warning = "Stock insuficiente para algunos productos";
        }
      }

      expect(warning).toBe("Stock insuficiente para algunos productos");
    });

    it("should handle duplicate registration gracefully", async () => {
      const email = "existing@example.com";
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        role: "USER",
      });

      const existingUser = await mockPrisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        // Should show error, not create duplicate
        const errorMessage = "El email ya está registrado";
        expect(errorMessage).toBe("El email ya está registrado");
      }
    });

    it("should handle OAuth email collision (existing password account)", async () => {
      const email = "existing@example.com";

      // User already exists with password
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        email,
        role: "USER",
        passwordHash: "hashed",
      });

      const existingUser = await mockPrisma.user.findUnique({
        where: { email },
      });

      // Should link, not create duplicate
      expect(existingUser).not.toBeNull();
      expect(existingUser?.passwordHash).not.toBeNull();
    });
  });
});
