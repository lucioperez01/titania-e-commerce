import { PaymentProvider } from "@/domain/order/entities/PaymentProvider";
import { OrderStatus } from "./OrderStatus";

export class Order {
    constructor(
        public readonly id: number,
            public readonly userId: number | null,
            public readonly email: string,
            public readonly fullName: string,
            public readonly phone: string,
            public readonly subtotal: number,
            public readonly total: number,
            public readonly status: OrderStatus,
            public readonly shippingProvider: string | null,
            public readonly shippingId: string | null,
            public readonly shippingCost: number | null,
            public readonly paymentProvider: PaymentProvider,
            public readonly paymentId: string | null,
            public readonly paidAt: Date | null,
            public readonly shippingAddressId: number,
            public readonly createdAt: Date,
            public readonly updatedAt: Date
    ){}
}