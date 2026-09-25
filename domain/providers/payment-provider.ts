/**
 * Payment provider interface.
 * Note: createPreference return fields (preferenceId, initPoint, sandboxInitPoint)
 * use MercadoPago-specific naming. When adding a new provider (Stripe, PayPal),
 * introduce an adapter mapper at the infrastructure layer to translate provider-specific
 * concepts into these field names, or generalize the interface in a future PR.
 */
export interface PaymentProvider {
    createPreference(params: {
        orderId: number
        email: string
        items: Array<{
            id: string
            title: string
            quantity: number
            unitPrice: number
            pictureUrl?: string
        }>
        notificationUrl: string
        successUrl: string
        failureUrl: string
        pendingUrl: string
    }): Promise<{
        preferenceId: string
        initPoint: string
        sandboxInitPoint?: string
    }>

    verifyPayment(paymentId: string): Promise<{
        status: 'approved' | 'pending' | 'rejected' | 'refunded'
        amount: number
        externalReference?: string
    }>
}
