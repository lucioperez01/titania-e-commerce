// Mock the entire mercadopago module before any imports
const mockPreferenceCreate = jest.fn();
const mockPaymentGet = jest.fn();

jest.mock("mercadopago", () => {
    const ActualMercadoPagoConfig = jest.requireActual("mercadopago").MercadoPagoConfig;

    class MockPreference {
        constructor() {}
        create = mockPreferenceCreate;
    }

    class MockPayment {
        constructor() {}
        get = mockPaymentGet;
    }

    class MockWebhookSignatureValidator {
        static validate = jest.fn();
    }

    return {
        __esModule: true,
        MercadoPagoConfig: ActualMercadoPagoConfig,
        default: ActualMercadoPagoConfig,
        Preference: MockPreference,
        Payment: MockPayment,
        WebhookSignatureValidator: MockWebhookSignatureValidator,
    };
});

import { MercadoPagoProvider } from "../mercado-pago-provider";

const FAKE_TOKEN = "test-access-token-123";

beforeEach(() => {
    jest.clearAllMocks();
});

describe("MercadoPagoProvider", () => {
    describe("constructor", () => {
        it("should throw if access token is empty", () => {
            expect(() => new MercadoPagoProvider("")).toThrow(
                "MercadoPago access token is required"
            );
        });

        it("should throw if access token is not provided", () => {
            // @ts-expect-error testing invalid input
            expect(() => new MercadoPagoProvider(undefined)).toThrow(
                "MercadoPago access token is required"
            );
        });

        it("should instantiate with a valid token", () => {
            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            expect(provider).toBeInstanceOf(MercadoPagoProvider);
        });
    });

    describe("createPreference", () => {
        const validParams = {
            orderId: 42,
            email: "buyer@example.com",
            items: [
                {
                    id: "item-1",
                    title: "Test Product",
                    quantity: 2,
                    unitPrice: 1500,
                    pictureUrl: "https://example.com/img.jpg",
                },
            ],
            notificationUrl: "https://titania.com/api/webhooks/mercadopago",
            successUrl: "https://titania.com/order/success",
            failureUrl: "https://titania.com/order/failure",
            pendingUrl: "https://titania.com/order/pending",
        };

        it("should create a preference and return id + initPoint", async () => {
            mockPreferenceCreate.mockResolvedValue({
                id: "pref-abc123",
                init_point: "https://mp.la/checkout/init/abc123",
                sandbox_init_point: "https://sandbox.mp.la/checkout/init/abc123",
                external_reference: "42",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.createPreference(validParams);

            expect(result).toEqual({
                preferenceId: "pref-abc123",
                initPoint: "https://mp.la/checkout/init/abc123",
                sandboxInitPoint: "https://sandbox.mp.la/checkout/init/abc123",
            });

            expect(mockPreferenceCreate).toHaveBeenCalledWith({
                body: {
                    external_reference: "42",
                    notification_url: validParams.notificationUrl,
                    back_urls: {
                        success: validParams.successUrl,
                        failure: validParams.failureUrl,
                        pending: validParams.pendingUrl,
                    },
                    items: [
                        {
                            id: "item-1",
                            title: "Test Product",
                            quantity: 2,
                            unit_price: 1500,
                            picture_url: "https://example.com/img.jpg",
                        },
                    ],
                    payer: {
                        email: "buyer@example.com",
                    },
                    auto_return: "approved",
                    binary_mode: true,
                },
            });
        });

        it("should work without optional pictureUrl", async () => {
            mockPreferenceCreate.mockResolvedValue({
                id: "pref-no-img",
                init_point: "https://mp.la/checkout/init/no-img",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.createPreference({
                ...validParams,
                items: [
                    {
                        id: "item-2",
                        title: "No Image Product",
                        quantity: 1,
                        unitPrice: 500,
                    },
                ],
            });

            expect(result.preferenceId).toBe("pref-no-img");
            expect(result.initPoint).toBe("https://mp.la/checkout/init/no-img");
            expect(result.sandboxInitPoint).toBeUndefined();

            const callArgs = mockPreferenceCreate.mock.calls[0][0];
            expect(callArgs.body.items[0]).not.toHaveProperty("picture_url");
        });

        it("should throw if MP does not return a preference ID", async () => {
            mockPreferenceCreate.mockResolvedValue({
                init_point: "https://mp.la/checkout/init/broken",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await expect(provider.createPreference(validParams)).rejects.toThrow(
                "MercadoPago did not return a preference ID"
            );
        });

        it("should throw if MP does not return an init_point", async () => {
            mockPreferenceCreate.mockResolvedValue({
                id: "pref-no-url",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await expect(provider.createPreference(validParams)).rejects.toThrow(
                "MercadoPago did not return an init_point URL"
            );
        });

        it("should propagate SDK errors", async () => {
            mockPreferenceCreate.mockRejectedValue(
                new Error("MP API unreachable")
            );

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await expect(provider.createPreference(validParams)).rejects.toThrow(
                "MP API unreachable"
            );
        });

        it("should handle multiple items", async () => {
            mockPreferenceCreate.mockResolvedValue({
                id: "pref-multi",
                init_point: "https://mp.la/checkout/init/multi",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await provider.createPreference({
                ...validParams,
                items: [
                    { id: "a", title: "Item A", quantity: 1, unitPrice: 100 },
                    { id: "b", title: "Item B", quantity: 3, unitPrice: 250 },
                ],
            });

            const callArgs = mockPreferenceCreate.mock.calls[0][0];
            expect(callArgs.body.items).toHaveLength(2);
            expect(callArgs.body.items[0].unit_price).toBe(100);
            expect(callArgs.body.items[1].unit_price).toBe(250);
        });
    });

    describe("verifyPayment", () => {
        it("should return approved status for approved payment", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "approved",
                transaction_amount: 3000,
                external_reference: "42",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result).toEqual({
                status: "approved",
                amount: 3000,
                externalReference: "42",
            });
            expect(mockPaymentGet).toHaveBeenCalledWith({ id: "12345" });
        });

        it("should map 'authorized' status to 'approved'", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "authorized",
                transaction_amount: 500,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.status).toBe("approved");
        });

        it("should map 'pending' and 'in_process' to 'pending'", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "in_process",
                transaction_amount: 750,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.status).toBe("pending");
            expect(result.amount).toBe(750);
        });

        it("should map 'in_mediation' to 'pending'", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "in_mediation",
                transaction_amount: 1000,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.status).toBe("pending");
        });

        it("should map 'rejected' and 'cancelled' to 'rejected'", async () => {
            const rejectedStatuses = ["rejected", "cancelled"];

            for (const status of rejectedStatuses) {
                mockPaymentGet.mockResolvedValue({
                    id: 12345,
                    status,
                    transaction_amount: 200,
                });

                const provider = new MercadoPagoProvider(FAKE_TOKEN);
                const result = await provider.verifyPayment("12345");

                expect(result.status).toBe("rejected");
            }
        });

        it("should map 'refunded' and 'charged_back' to 'refunded'", async () => {
            const refundedStatuses = ["refunded", "charged_back"];

            for (const status of refundedStatuses) {
                mockPaymentGet.mockResolvedValue({
                    id: 12345,
                    status,
                    transaction_amount: 200,
                });

                const provider = new MercadoPagoProvider(FAKE_TOKEN);
                const result = await provider.verifyPayment("12345");

                expect(result.status).toBe("refunded");
            }
        });

        it("should default unknown status to 'pending' and log a warning", async () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "some_future_status",
                transaction_amount: 100,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.status).toBe("pending");
            expect(warnSpy).toHaveBeenCalledWith(
                "Unknown MercadoPago payment status:",
                "some_future_status"
            );

            warnSpy.mockRestore();
        });

        it("should default amount to 0 when missing", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "approved",
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.amount).toBe(0);
        });

        it("should return undefined externalReference when missing", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                status: "approved",
                transaction_amount: 100,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            const result = await provider.verifyPayment("12345");

            expect(result.externalReference).toBeUndefined();
        });

        it("should throw if MP response is missing status", async () => {
            mockPaymentGet.mockResolvedValue({
                id: 12345,
                transaction_amount: 100,
            });

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await expect(provider.verifyPayment("12345")).rejects.toThrow(
                "MercadoPago payment response missing status"
            );
        });

        it("should propagate SDK errors", async () => {
            mockPaymentGet.mockRejectedValue(new Error("Payment not found"));

            const provider = new MercadoPagoProvider(FAKE_TOKEN);
            await expect(provider.verifyPayment("99999")).rejects.toThrow(
                "Payment not found"
            );
        });
    });
});
