import { PaymentProvider } from "@/domain/providers/payment-provider";

export class MercadoPagoProvider implements PaymentProvider {
    async createCheckoutSession(data: { amount: number; currency: string; }): Promise<{ checkoutUrl: string; }> {
        console.log("falta impklementacion de mercado pago")
        return {
            checkoutUrl: ""
        }
    }
}