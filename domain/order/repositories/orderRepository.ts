import { Order } from "@/domain/order/entities/Order"
import { User } from "@/domain/user/entities/user"

export interface OrderRepository {
    findAll(): Promise<Order[]>
    findById(id: number): Promise<Order | null>
    findByUser(user: User): Promise<Order | null>
    addOrder(order: Order): Promise<void>
    updateOrder(order: Order): Promise<void>
    deleteOrder(id: number): Promise<void>
    findGuestOrdersByEmail(email: string): Promise<Array<{ id: number; email: string; userId: number | null }>>
    linkOrdersToUser(email: string, userId: number): Promise<{ count: number }>
}