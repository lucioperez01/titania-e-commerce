import { mergeCart } from "../merge-cart";
import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartStatus } from "@/domain/cart/entities/cartStatus";

describe("mergeCart use-case", () => {
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

  it("should return success with no items to merge", async () => {
    const result = await mergeCart(mockCartRepository, 1, []);
    expect(result.success).toBe(true);
  });

  it("should merge items into existing cart", async () => {
    const cart = new Cart(1, 1, [], null, CartStatus.ACTIVE, new Date(), new Date());
    mockCartRepository.findByUserId.mockResolvedValue(cart);
    mockCartRepository.mergeItems.mockResolvedValue(undefined);

    const result = await mergeCart(mockCartRepository, 1, [
      { productId: 10, quantity: 2, variantId: null },
    ]);

    expect(result.success).toBe(true);
    expect(mockCartRepository.mergeItems).toHaveBeenCalledWith(1, [
      { productId: 10, quantity: 2, variantId: null },
    ]);
  });

  it("should return error when merge fails", async () => {
    const cart = new Cart(1, 1, [], null, CartStatus.ACTIVE, new Date(), new Date());
    mockCartRepository.findByUserId.mockResolvedValue(cart);
    mockCartRepository.mergeItems.mockRejectedValue(new Error("DB error"));

    const result = await mergeCart(mockCartRepository, 1, [
      { productId: 10, quantity: 2, variantId: null },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al fusionar el carrito");
  });
});
