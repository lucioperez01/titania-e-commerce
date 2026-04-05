export interface PaymentProvider {
    createCheckoutSession(data: {
        amount: number
        currency: string
    }): Promise<{ checkoutUrl: string }>
}   