// Mock dependencies before any imports
const mockTransaction = jest.fn();
const mockCartFindUnique = jest.fn();
const mockProductFindMany = jest.fn();
const mockAddressCreate = jest.fn();
const mockOrderCreate = jest.fn();
const mockOrderUpdate = jest.fn();
const mockProductVariantUpdate = jest.fn();
const mockProductUpdate = jest.fn();
const mockCartUpdate = jest.fn();
const mockPreferenceCreate = jest.fn();

// Mock Prisma
jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: {
    $transaction: mockTransaction,
    cart: {
      findUnique: mockCartFindUnique,
      update: mockCartUpdate,
    },
    product: {
      findMany: mockProductFindMany,
      update: mockProductUpdate,
    },
    productVariant: {
      update: mockProductVariantUpdate,
    },
    address: {
      create: mockAddressCreate,
    },
    order: {
      create: mockOrderCreate,
      update: mockOrderUpdate,
    },
  },
}));

// Mock MercadoPago
const MockMercadoPagoConfig = jest.fn().mockImplementation(() => ({}));
const MockPreference = jest.fn().mockImplementation(() => ({
  create: mockPreferenceCreate,
}));
const MockPayment = jest.fn().mockImplementation(() => ({}));
const MockWebhookSignatureValidator = { validate: jest.fn() };

jest.mock("mercadopago", () => {
  return {
    __esModule: true,
    default: MockMercadoPagoConfig,
    MercadoPagoConfig: MockMercadoPagoConfig,
    Preference: MockPreference,
    Payment: MockPayment,
    WebhookSignatureValidator: MockWebhookSignatureValidator,
  };
});

import { CreateReservedOrder } from "../create-reserved-order";

const FAKE_TOKEN = "test-access-token";

const validInput = {
  userId: 1,
  email: "test@example.com",
  fullName: "Test User",
  phone: "+5491112345678",
  addressLine1: "Calle Falsa 123",
  addressCity: "Buenos Aires",
  addressProvince: "CABA",
  addressPostalCode: "1425",
  addressCountry: "AR",
  cartId: 42,
};

const mockCart = {
  id: 42,
  userId: 1,
  status: "ACTIVE",
  items: [
    { id: 1, productId: 10, variantId: null, quantity: 2 },
  ],
};

const mockProducts = [
  {
    id: 10,
    name: "Test Product",
    price: 5000,
    stock: 10,
    reservedStock: 0,
    variants: [],
    images: [{ id: 1, url: "https://example.com/img.jpg" }],
  },
];

const mockAddress = { id: 100 };
const mockOrder = { id: 200 };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  delete process.env.VERCEL_URL;
});

describe("CreateReservedOrder", () => {
  describe("validation", () => {
    it("should throw if cart is empty", async () => {
      mockCartFindUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "El carrito está vacío"
      );
    });

    it("should throw if cart is not found", async () => {
      mockCartFindUnique.mockResolvedValue(null);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "El carrito está vacío"
      );
    });

    it("should throw if cart is already converted", async () => {
      mockCartFindUnique.mockResolvedValue({
        ...mockCart,
        status: "CONVERTED",
      });

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "Este carrito ya fue convertido en un pedido"
      );
    });

    it("should throw if product not found", async () => {
      mockCartFindUnique.mockResolvedValue(mockCart);
      mockProductFindMany.mockResolvedValue([]);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "Producto #10 no encontrado"
      );
    });

    it("should throw if insufficient stock", async () => {
      mockCartFindUnique.mockResolvedValue(mockCart);
      mockProductFindMany.mockResolvedValue([
        {
          ...mockProducts[0],
          stock: 1,
          reservedStock: 0,
        },
      ]);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "Stock insuficiente"
      );
    });

    it("should throw if stock equals reservedStock (no available)", async () => {
      mockCartFindUnique.mockResolvedValue(mockCart);
      mockProductFindMany.mockResolvedValue([
        {
          ...mockProducts[0],
          stock: 5,
          reservedStock: 5,
        },
      ]);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "Stock insuficiente"
      );
    });
  });

  describe("happy path", () => {
    beforeEach(() => {
      mockCartFindUnique.mockResolvedValue(mockCart);
      mockProductFindMany.mockResolvedValue(mockProducts);
      mockAddressCreate.mockResolvedValue(mockAddress);
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockProductUpdate.mockResolvedValue({});
      mockCartUpdate.mockResolvedValue({});
      mockPreferenceCreate.mockResolvedValue({
        id: "pref-123",
        init_point: "https://mp.la/checkout/init/123",
        sandbox_init_point: "https://sandbox.mp.la/checkout/init/123",
      });
    });

    it("should create a RESERVED order with correct data", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      const result = await useCase.execute(validInput);

      expect(result.orderId).toBe(200);
      expect(result.preferenceId).toBe("pref-123");
      expect(result.initPoint).toBe("https://mp.la/checkout/init/123");
      expect(result.sandboxInitPoint).toBe("https://sandbox.mp.la/checkout/init/123");
    });

    it("should increment reservedStock atomically", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await useCase.execute(validInput);

      expect(mockProductUpdate).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { reservedStock: { increment: 2 } },
      });
    });

    it("should mark cart as CONVERTED", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await useCase.execute(validInput);

      expect(mockCartUpdate).toHaveBeenCalledWith({
        where: { id: 42 },
        data: { status: "CONVERTED" },
      });
    });

    it("should create MP preference with correct items", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await useCase.execute(validInput);

      expect(mockPreferenceCreate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          external_reference: "200",
          notification_url: "http://localhost:3000/api/webhooks/mercadopago",
          back_urls: {
            success: "http://localhost:3000/order/success?order_id=200",
            failure: "http://localhost:3000/order/failure?order_id=200",
            pending: "http://localhost:3000/order/pending?order_id=200",
          },
          items: expect.arrayContaining([
            expect.objectContaining({
              id: "product-10",
              title: "Test Product",
              quantity: 2,
              unit_price: 5000,
              picture_url: "https://example.com/img.jpg",
            }),
          ]),
          payer: { email: "test@example.com" },
          auto_return: "approved",
          binary_mode: true,
        }),
      });
    });

    it("should store preferenceId on order after creation", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await useCase.execute(validInput);

      expect(mockOrderUpdate).toHaveBeenCalledWith({
        where: { id: 200 },
        data: { preferenceId: "pref-123" },
      });
    });
  });

  describe("variant handling", () => {
    it("should use variant price when variantId is provided", async () => {
      const cartWithVariant = {
        ...mockCart,
        items: [{ id: 1, productId: 10, variantId: 5, quantity: 1 }],
      };

      mockCartFindUnique.mockResolvedValue(cartWithVariant);
      mockProductFindMany.mockResolvedValue([
        {
          ...mockProducts[0],
          price: 5000,
          variants: [
            { id: 5, sku: "SKU-001", price: 6000, stock: 10, reservedStock: 0 },
          ],
        },
      ]);
      mockAddressCreate.mockResolvedValue(mockAddress);
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockProductVariantUpdate.mockResolvedValue({});
      mockCartUpdate.mockResolvedValue({});
      mockPreferenceCreate.mockResolvedValue({
        id: "pref-variant",
        init_point: "https://mp.la/checkout/init/variant",
      });

      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      const result = await useCase.execute(validInput);

      expect(result.initPoint).toBe("https://mp.la/checkout/init/variant");
      expect(mockProductVariantUpdate).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { reservedStock: { increment: 1 } },
      });
    });
  });

  describe("MP failure", () => {
    it("should throw if MP preference creation fails", async () => {
      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);
      mockCartFindUnique.mockResolvedValue(mockCart);
      mockProductFindMany.mockResolvedValue(mockProducts);
      mockAddressCreate.mockResolvedValue(mockAddress);
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockProductUpdate.mockResolvedValue({});
      mockCartUpdate.mockResolvedValue({});
      mockPreferenceCreate.mockRejectedValue(new Error("MP API unreachable"));

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await expect(useCase.execute(validInput)).rejects.toThrow(
        "No se pudo conectar con MercadoPago"
      );
    });
  });

  describe("pricing", () => {
    it("should apply free shipping for orders >= 50000", async () => {
      const expensiveCart = {
        ...mockCart,
        items: [{ id: 1, productId: 10, variantId: null, quantity: 10 }],
      };

      const expensiveProducts = [
        {
          ...mockProducts[0],
          price: 6000, // 6000 * 10 = 60000 > 50000
          stock: 100,
        },
      ];

      mockCartFindUnique.mockResolvedValue(expensiveCart);
      mockProductFindMany.mockResolvedValue(expensiveProducts);
      mockAddressCreate.mockResolvedValue(mockAddress);
      mockOrderCreate.mockResolvedValue(mockOrder);
      mockProductUpdate.mockResolvedValue({});
      mockCartUpdate.mockResolvedValue({});
      mockPreferenceCreate.mockResolvedValue({
        id: "pref-expensive",
        init_point: "https://mp.la/checkout/init/expensive",
      });

      const txMock = jest.fn().mockImplementation(async (fn) => fn({
        address: { create: mockAddressCreate },
        order: { create: mockOrderCreate },
        product: { update: mockProductUpdate },
        productVariant: { update: mockProductVariantUpdate },
        cart: { update: mockCartUpdate },
      }));

      mockTransaction.mockImplementation(txMock);

      const useCase = new CreateReservedOrder(FAKE_TOKEN);
      await useCase.execute(validInput);

      // Verify order was created with total = 60000 + 0 (free shipping)
      expect(mockOrderCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 60000,
            total: 60000, // free shipping
            shippingCost: 0,
          }),
        })
      );
    });
  });
});
