import { Order } from "@/domain/order/entities/Order";
import { OrderRepository } from "@/domain/order/repositories/orderRepository";
import { prisma } from "../db/prismaClient";
import { OrderStatus as DomainOrderStatus } from "@/domain/order/entities/OrderStatus";
import { PaymentProvider as DomainPaymentProvider } from "@/domain/order/entities/PaymentProvider";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { PaymentProvider as PrismaPaymentProvider } from "@prisma/client";
import { User } from "@/domain/user/entities/user";

export class PrismaOrderRepository implements OrderRepository {

    private mapToOrder(data: any) {
        return data.map((order: { id: number; userId: number | null; email: string; fullName: string; phone: string; subtotal: number; total: number; status: DomainOrderStatus; shippingProvider: string | null; shippingId: string | null; shippingCost: number | null; paymentProvider: DomainPaymentProvider; paymentId: string | null; paidAt: Date | null; shippingAddressId: number; createdAt: Date; updatedAt: Date; }) => new Order(
            order.id,
            order.userId,
            order.email,
            order.fullName,
            order.phone,
            order.subtotal,
            order.total,
            order.status,
            order.shippingProvider,
            order.shippingId,
            order.shippingCost,
            order.paymentProvider,
            order.paymentId,
            order.paidAt,
            order.shippingAddressId,
            order.createdAt,
            order.updatedAt
        ));
    }

    async findAll(): Promise<Order[]> {
        const orders = await prisma.order.findMany()
        return this.mapToOrder(orders)
    }

    async findById(id: number): Promise<Order | null> {
        const order = await prisma.order.findUnique({where: {id}})
        return this.mapToOrder(order)
    }

    async findByUser(user: User): Promise<Order | null> {
        const userId = user.id
        const order = await prisma.order.findMany({where: {userId}})
        return this.mapToOrder(order)
    }

    async mapToOrderStatus(order: Order): Promise<PrismaOrderStatus>{
        const orderStatusMap: Record<DomainOrderStatus, PrismaOrderStatus> = {
            [DomainOrderStatus.PENDING]: PrismaOrderStatus.PENDING,
            [DomainOrderStatus.RESERVED]: PrismaOrderStatus.RESERVED,
            [DomainOrderStatus.PAID]: PrismaOrderStatus.PAID,
            [DomainOrderStatus.SHIPPED]: PrismaOrderStatus.SHIPPED,
            [DomainOrderStatus.CANCELLED]: PrismaOrderStatus.CANCELLED,
            [DomainOrderStatus.DELIVERED]: PrismaOrderStatus.DELIVERED,
            [DomainOrderStatus.EXPIRED]: PrismaOrderStatus.EXPIRED,
            [DomainOrderStatus.RETURNED]: PrismaOrderStatus.RETURNED,
            [DomainOrderStatus.REFUNDED]: PrismaOrderStatus.REFUNDED,
            }
            return orderStatusMap[order.status]
    }

    async mapToPaymentProvider(order: Order): Promise<PrismaPaymentProvider>{
        const paymentProviderMap: Record<DomainPaymentProvider, PrismaPaymentProvider> = {
            [DomainPaymentProvider.STRIPE]: PrismaPaymentProvider.STRIPE,
            [DomainPaymentProvider.MERCADOPAGO]: PrismaPaymentProvider.MERCADOPAGO,
            [DomainPaymentProvider.TRANSFER]: PrismaPaymentProvider.TRANSFER,
        }
        return paymentProviderMap[order.paymentProvider]
    }

    async mapToEntity(order: Order){
        const entityMapObject = {
                    userId: order.userId,
                    email: order.email,
                    fullName: order.fullName,
                    phone: order.phone,
                    subtotal: order.subtotal,
                    total: order.total,
                    status:await this.mapToOrderStatus(order),
                    shippingProvider: order.shippingProvider,
                    shippingId: order.shippingId,
                    shippingCost: order.shippingCost,
                    paymentProvider: await this.mapToPaymentProvider(order),
                    paymentId: order.paymentId,
                    paidAt: order.paidAt,
                    shippingAddressId: order.shippingAddressId
                }
        return entityMapObject
    }

    async addOrder(order: Order): Promise<void> {
        
        
        if(order != null && order.total != null && order.shippingAddressId != null){
            await prisma.order.create({
                data: await this.mapToEntity(order)
            })
            }
        }

        async deleteOrder(id: number): Promise<void> {
            if( id != null ){
                await prisma.order.delete({where: {id}})
            }
        }

        
        async updateOrder(order: Order): Promise<void> {
            if(order != null){
                const orderUpdated = await this.mapToOrder(order)
                await prisma.order.update(orderUpdated)
            }
        }
    }
