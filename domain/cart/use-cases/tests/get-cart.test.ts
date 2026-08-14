import { getCart } from "../get-cart";
import { Cart } from "@/domain/cart/entities/cart";
import { CartItem } from "@/domain/cart/entities/cartItem";
import { CartStatus } from "@/domain/cart/entities/cartStatus";

describe("getCart use-case", () => {
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

  it("should return empty cart when user has no cart", async () => {
    mockCartRepository.findByUserId.mockResolvedValue(null);

    const result = await getCart(mockCartRepository, 1);

    expect(result).toEqual({ id: 0, userId: 1, items: [], status: "ACTIVE" });
  });

  it("should return cart with items when user has a cart", async () => {
    const cart = new Cart(
      1, 1,
      [new CartItem(1, 1, 10, 2, null), new CartItem(2, 1, 20, 1, null)],
      null, CartStatus.ACTIVE, new Date(), new Date()
    );
    mockCartRepository.findByUserId.mockResolvedValue(cart);

    const result = await getCart(mockCartRepository, 1);

    expect(result.id).toBe(1);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].productId).toBe(10);
    expect(result.items[0].quantity).toBe(2);
  });
});
