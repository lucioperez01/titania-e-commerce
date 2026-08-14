import { linkOrdersByEmail } from "../link-orders-by-email";

describe("linkOrdersByEmail use-case", () => {
  const mockOrderRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    addOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    findGuestOrdersByEmail: jest.fn(),
    linkOrdersToUser: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("should return success with 0 linked when no guest orders exist", async () => {
    mockOrderRepository.findGuestOrdersByEmail.mockResolvedValue([]);

    const result = await linkOrdersByEmail(mockOrderRepository, "user@example.com", 1);

    expect(result.success).toBe(true);
    expect(result.linkedCount).toBe(0);
  });

  it("should link guest orders to user", async () => {
    mockOrderRepository.findGuestOrdersByEmail.mockResolvedValue([
      { id: 10, email: "user@example.com", userId: null },
      { id: 11, email: "user@example.com", userId: null },
    ]);
    mockOrderRepository.linkOrdersToUser.mockResolvedValue({ count: 2 });

    const result = await linkOrdersByEmail(mockOrderRepository, "user@example.com", 1);

    expect(result.success).toBe(true);
    expect(result.linkedCount).toBe(2);
    expect(mockOrderRepository.linkOrdersToUser).toHaveBeenCalledWith("user@example.com", 1);
  });

  it("should be idempotent (no orders to link on second call)", async () => {
    mockOrderRepository.findGuestOrdersByEmail.mockResolvedValue([]);

    const result = await linkOrdersByEmail(mockOrderRepository, "user@example.com", 1);

    expect(result.success).toBe(true);
    expect(result.linkedCount).toBe(0);
  });

  it("should return error on failure", async () => {
    mockOrderRepository.findGuestOrdersByEmail.mockRejectedValue(new Error("DB error"));

    const result = await linkOrdersByEmail(mockOrderRepository, "user@example.com", 1);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al vincular órdenes");
  });
});
