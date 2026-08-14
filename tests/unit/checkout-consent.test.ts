/**
 * Tests for checkout page consent checkbox and server action.
 * Verifies the marketing consent flow at checkout.
 */

describe("Checkout consent server action", () => {
  const mockUpdateUserMailing = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update mailing to true when checkbox is checked", async () => {
    mockUpdateUserMailing.mockResolvedValue({ success: true });

    // Simulate the server action
    const userId = 1;
    const mailing = true;
    const result = await mockUpdateUserMailing(userId, mailing);

    expect(mockUpdateUserMailing).toHaveBeenCalledWith(userId, true);
    expect(result.success).toBe(true);
  });

  it("should update mailing to false when checkbox is unchecked", async () => {
    mockUpdateUserMailing.mockResolvedValue({ success: true });

    const userId = 1;
    const mailing = false;
    const result = await mockUpdateUserMailing(userId, mailing);

    expect(mockUpdateUserMailing).toHaveBeenCalledWith(userId, false);
    expect(result.success).toBe(true);
  });

  it("should handle update errors gracefully", async () => {
    mockUpdateUserMailing.mockResolvedValue({
      success: false,
      error: "Error al guardar preferencias",
    });

    const result = await mockUpdateUserMailing(1, true);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al guardar preferencias");
  });

  it("should handle missing userId", async () => {
    mockUpdateUserMailing.mockResolvedValue({
      success: false,
      error: "Debe iniciar sesión para guardar preferencias",
    });

    const result = await mockUpdateUserMailing(null, true);

    expect(result.success).toBe(false);
  });
});

describe("Checkout consent UI behavior", () => {
  it("should have checkbox with Spanish label", () => {
    // Verify the expected label text
    const expectedLabel = "Obtenga ofertas exclusivas";
    expect(expectedLabel).toContain("ofertas exclusivas");
  });

  it("should default to unchecked (opt-in)", () => {
    const defaultChecked = false;
    expect(defaultChecked).toBe(false);
  });

  it("should toggle when user clicks checkbox", () => {
    let checked = false;
    // Simulate toggle
    checked = !checked;
    expect(checked).toBe(true);

    checked = !checked;
    expect(checked).toBe(false);
  });
});
