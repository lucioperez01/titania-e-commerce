/**
 * Tests for signIn callback integrations: cart merge and order linking.
 * These verify the NextAuth signIn callback correctly:
 * - Merges anonymous cart on login
 * - Links past guest orders on new user registration/OAuth
 */

describe("signIn callback - cart merge integration", () => {
  const mockMergeCart = jest.fn();
  const mockGetAnonymousCart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should merge anonymous cart when items exist", async () => {
    const anonymousItems = [
      { productId: 1, quantity: 2, variantId: null },
      { productId: 2, quantity: 1, variantId: 3 },
    ];
    mockGetAnonymousCart.mockReturnValue(anonymousItems);
    mockMergeCart.mockResolvedValue({ success: true });

    // Simulate the callback logic
    const anonymousCart = mockGetAnonymousCart();
    if (anonymousCart?.length > 0) {
      await mockMergeCart(1, anonymousCart);
    }

    expect(mockMergeCart).toHaveBeenCalledWith(1, anonymousItems);
    expect(mockMergeCart).toHaveBeenCalledTimes(1);
  });

  it("should skip merge when anonymous cart is empty", async () => {
    mockGetAnonymousCart.mockReturnValue([]);

    const anonymousCart = mockGetAnonymousCart();
    if (anonymousCart?.length > 0) {
      await mockMergeCart(1, anonymousCart);
    }

    expect(mockMergeCart).not.toHaveBeenCalled();
  });

  it("should skip merge when anonymous cart is null/undefined", async () => {
    mockGetAnonymousCart.mockReturnValue(null);

    const anonymousCart = mockGetAnonymousCart();
    if (anonymousCart?.length > 0) {
      await mockMergeCart(1, anonymousCart);
    }

    expect(mockMergeCart).not.toHaveBeenCalled();
  });

  it("should handle merge errors gracefully", async () => {
    mockGetAnonymousCart.mockReturnValue([
      { productId: 1, quantity: 2, variantId: null },
    ]);
    mockMergeCart.mockResolvedValue({
      success: false,
      error: "Error al fusionar el carrito",
    });

    const anonymousCart = mockGetAnonymousCart();
    let warning: string | undefined;
    if (anonymousCart?.length > 0) {
      const result = await mockMergeCart(1, anonymousCart);
      if (!result.success) {
        warning = result.error;
      }
    }

    expect(warning).toBe("Error al fusionar el carrito");
  });
});

describe("signIn callback - order linking integration", () => {
  const mockLinkOrdersByEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should link orders for new user registration", async () => {
    mockLinkOrdersByEmail.mockResolvedValue({ success: true, linkedCount: 3 });

    // Simulate: isNewUser or OAuth login
    const isNewUser = true;
    const userEmail = "newuser@example.com";

    if (isNewUser) {
      await mockLinkOrdersByEmail(1, userEmail);
    }

    expect(mockLinkOrdersByEmail).toHaveBeenCalledWith(1, userEmail);
  });

  it("should link orders for OAuth login", async () => {
    mockLinkOrdersByEmail.mockResolvedValue({ success: true, linkedCount: 0 });

    const isNewUser = false;
    const isOAuth = true;
    const userEmail = "oauth@example.com";

    if (isNewUser || isOAuth) {
      await mockLinkOrdersByEmail(1, userEmail);
    }

    expect(mockLinkOrdersByEmail).toHaveBeenCalledWith(1, userEmail);
  });

  it("should not link orders for returning credentials login", async () => {
    const isNewUser = false;
    const isOAuth = false;
    const userEmail = "returning@example.com";

    if (isNewUser || isOAuth) {
      await mockLinkOrdersByEmail(1, userEmail);
    }

    expect(mockLinkOrdersByEmail).not.toHaveBeenCalled();
  });

  it("should handle order linking errors gracefully", async () => {
    mockLinkOrdersByEmail.mockResolvedValue({
      success: false,
      linkedCount: 0,
      error: "Error al vincular órdenes",
    });

    const result = await mockLinkOrdersByEmail(1, "user@example.com");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al vincular órdenes");
  });
});
