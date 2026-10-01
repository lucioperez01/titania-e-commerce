import MercadoPagoConfig, { Preference, Payment } from "mercadopago";
import { PaymentProvider } from "@/domain/providers/payment-provider";

export class MercadoPagoProvider implements PaymentProvider {
    private client: MercadoPagoConfig;
    private preferenceClient: Preference;
    private paymentClient: Payment;

    constructor(accessToken: string) {
        if (!accessToken) {
            throw new Error("MercadoPago access token is required");
        }

        this.client = new MercadoPagoConfig({ accessToken });
        this.preferenceClient = new Preference(this.client);
        this.paymentClient = new Payment(this.client);
    }

    async createPreference(params: {
        orderId: number;
        email: string;
        items: Array<{
            id: string;
            title: string;
            quantity: number;
            unitPrice: number;
            pictureUrl?: string;
        }>;
        notificationUrl: string;
        successUrl: string;
        failureUrl: string;
        pendingUrl: string;
    }): Promise<{
        preferenceId: string;
        initPoint: string;
        sandboxInitPoint?: string;
    }> {
        const response = await this.preferenceClient.create({
            body: {
                external_reference: String(params.orderId),
                notification_url: params.notificationUrl,
                back_urls: {
                    success: params.successUrl,
                    failure: params.failureUrl,
                    pending: params.pendingUrl,
                },
                items: params.items.map((item) => ({
                    id: item.id,
                    title: item.title,
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    ...(item.pictureUrl ? { picture_url: item.pictureUrl } : {}),
                })),
                payer: {
                    email: params.email,
                },
                // auto_return solo funciona en producción, no en sandbox
                // auto_return: "approved",
                binary_mode: true,
            },
        });

        if (!response.id) {
            throw new Error("MercadoPago did not return a preference ID");
        }

        if (!response.init_point) {
            throw new Error("MercadoPago did not return an init_point URL");
        }

        return {
            preferenceId: response.id,
            initPoint: response.init_point,
            sandboxInitPoint: response.sandbox_init_point,
        };
    }

    async verifyPayment(paymentId: string): Promise<{
        status: "approved" | "pending" | "rejected" | "refunded";
        amount: number;
        externalReference?: string;
    }> {
        const payment = await this.paymentClient.get({ id: paymentId });

        if (!payment.status) {
            throw new Error("MercadoPago payment response missing status");
        }

        const status = mapPaymentStatus(payment.status);

        return {
            status,
            amount: payment.transaction_amount ?? 0,
            externalReference: payment.external_reference,
        };
    }
}

function mapPaymentStatus(
    status: string
): "approved" | "pending" | "rejected" | "refunded" {
    switch (status) {
        case "approved":
        case "authorized":
            return "approved";
        case "pending":
        case "in_process":
        case "in_mediation":
            return "pending";
        case "rejected":
        case "cancelled":
            return "rejected";
        case "refunded":
        case "charged_back":
            return "refunded";
        default:
            console.warn("Unknown MercadoPago payment status:", status);
            return "pending";
    }
}
