import { addToCart } from "../add-to-cart";

describe("addToCart use-case", () => {
  const mockCartRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAbandoned: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    addItem: jest.fn(),
    mergeItems: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("should add item successfully", async () => {
    mockCartRepository.addItem.mockResolvedValue(undefined);

    const result = await addToCart(mockCartRepository, 1, 10, 2, null);

    expect(result.success).toBe(true);
    expect(mockCartRepository.addItem).toHaveBeenCalledWith(1, 10, 2, null);
  });

  it("should return error on insufficient stock", async () => {
    mockCartRepository.addItem.mockRejectedValue(new Error("Insufficient stock"));

    const result = await addToCart(mockCartRepository, 1, 10, 5, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Stock insuficiente");
  });

  it("should return error when cart not found", async () => {
    mockCartRepository.addItem.mockRejectedValue(new Error("Cart not found"));

    const result = await addToCart(mockCartRepository, 999, 10, 1, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Carrito no encontrado");
  });
});
