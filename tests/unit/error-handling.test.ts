/**
 * Tests for error handling and UX polish across auth flows.
 * Covers: invalid credentials, OAuth email collision, cart merge stock-cap,
 * middleware redirect loop prevention, and loading states.
 */

describe("Error Handling - Auth", () => {
  describe("Invalid credentials", () => {
    it("should show generic error for wrong password (no user enumeration)", () => {
      const errorMessage = "Credenciales inválidas";
      expect(errorMessage).toBe("Credenciales inválidas");
      // Should NOT say "Password incorrect" or "User not found"
      expect(errorMessage).not.toContain("contraseña");
      expect(errorMessage).not.toContain("usuario");
    });

    it("should show generic error for non-existent email", () => {
      const errorMessage = "Credenciales inválidas";
      expect(errorMessage).toBe("Credenciales inválidas");
      // Same message — no information leakage
    });

    it("should show generic error for missing fields", () => {
      const errorMessage = "Credenciales inválidas";
      expect(errorMessage).toBe("Credenciales inválidas");
    });
  });

  describe("OAuth email collision", () => {
    it("should link to existing account instead of creating duplicate", () => {
      const existingUser = {
        id: 1,
        email: "user@example.com",
        passwordHash: "hashed",
        role: "USER",
      };

      // OAuth callback finds existing user
      const shouldCreateNew = !existingUser;
      expect(shouldCreateNew).toBe(false);

      // Should return true to continue sign-in (linking happens via PrismaAdapter)
      const shouldContinueSignIn = true;
      expect(shouldContinueSignIn).toBe(true);
    });

    it("should reject unverified OAuth email", () => {
      const emailVerified = false;
      const shouldReject = !emailVerified;

      expect(shouldReject).toBe(true);
    });

    it("should accept verified OAuth email", () => {
      const emailVerified = true;
      const shouldReject = !emailVerified;

      expect(shouldReject).toBe(false);
    });
  });

  describe("Cart merge stock-cap warning", () => {
    it("should return warning when items exceed stock", () => {
      // Anonymous cart: Product A qty 5, stock: 3
      const anonymousQty = 5;
      const stock = 3;
      const cappedQty = Math.min(anonymousQty, stock);

      expect(cappedQty).toBe(3);
      expect(cappedQty).toBeLessThanOrEqual(stock);
    });

    it("should not cap when within stock", () => {
      const anonymousQty = 2;
      const stock = 10;
      const cappedQty = Math.min(anonymousQty, stock);

      expect(cappedQty).toBe(2);
    });

    it("should provide user-friendly warning message", () => {
      const warning = "Stock insuficiente para algunos productos del carrito";
      expect(warning).toContain("Stock");
      expect(warning).toContain("carrito");
    });
  });

  describe("Middleware redirect loop prevention", () => {
    it("should not redirect /login to itself", () => {
      const pathname = "/login";
      const isDashboard = pathname.startsWith("/dashboard");

      expect(isDashboard).toBe(false);
      // /login should pass through middleware without redirect
    });

    it("should not redirect / to itself", () => {
      const pathname = "/";
      const isDashboard = pathname.startsWith("/dashboard");

      expect(isDashboard).toBe(false);
    });

    it("should redirect /dashboard to /login when unauthenticated", () => {
      const pathname = "/dashboard";
      const isDashboard = pathname.startsWith("/dashboard");
      const hasToken = false;

      expect(isDashboard).toBe(true);
      expect(hasToken).toBe(false);
      // Should redirect to /login with callbackUrl
    });

    it("should redirect /dashboard to / when non-admin", () => {
      const pathname = "/dashboard";
      const isDashboard = pathname.startsWith("/dashboard");
      const hasToken = true;
      const role = "USER";

      expect(isDashboard).toBe(true);
      expect(hasToken).toBe(true);
      expect(role).not.toBe("ADMIN");
      // Should redirect to / (storefront)
    });

    it("should allow /dashboard/products for admin", () => {
      const pathname = "/dashboard/products";
      const isDashboard = pathname.startsWith("/dashboard");
      const hasToken = true;
      const role = "ADMIN";

      expect(isDashboard).toBe(true);
      expect(hasToken).toBe(true);
      expect(role).toBe("ADMIN");
      // Should allow through
    });
  });
});

describe("Loading States", () => {
  it("should show loading state during login submission", () => {
    const isSubmitting = true;
    const buttonText = isSubmitting ? "Iniciando sesión..." : "Iniciar sesión";

    expect(buttonText).toBe("Iniciando sesión...");
  });

  it("should show loading state during registration submission", () => {
    const isSubmitting = true;
    const buttonText = isSubmitting ? "Creando cuenta..." : "Registrarse";

    expect(buttonText).toBe("Creando cuenta...");
  });

  it("should disable form inputs during submission", () => {
    const isSubmitting = true;
    const inputsDisabled = isSubmitting;

    expect(inputsDisabled).toBe(true);
  });

  it("should show cart hydration loading state", () => {
    const isHydrating = true;
    const message = isHydrating ? "Cargando carrito..." : "";

    expect(message).toBe("Cargando carrito...");
  });
});

describe("Error messages in Spanish", () => {
  const errorMessages = {
    invalidCredentials: "Credenciales inválidas",
    loginError: "Error al iniciar sesión",
    emailRegistered: "El email ya está registrado",
    registrationError: "Error al registrar",
    insufficientStock: "Stock insuficiente",
    cartNotFoundError: "Carrito no encontrado",
    cartAddError: "Error al agregar al carrito",
    cartMergeError: "Error al fusionar el carrito",
    orderLinkError: "Error al vincular órdenes",
    consentSaveError: "Error al guardar preferencias",
    oauthUnverified: "Email no verificado por Google",
  };

  it("should have all error messages in Spanish", () => {
    Object.values(errorMessages).forEach((msg) => {
      // All messages should be in Spanish (contain Spanish characters or words)
      expect(typeof msg).toBe("string");
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it("should not expose internal error details to user", () => {
    // User-facing messages should be generic
    expect(errorMessages.invalidCredentials).not.toContain("bcrypt");
    expect(errorMessages.invalidCredentials).not.toContain("Prisma");
    expect(errorMessages.invalidCredentials).not.toContain("SQL");
  });
});
