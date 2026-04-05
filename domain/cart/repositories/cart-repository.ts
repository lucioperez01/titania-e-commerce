import { Cart } from "../entities/cart"

export interface CartRepository {
    findAll(): Promise<Cart[]>
    findById(id: number): Promise<Cart | null>
    findByUserId(userId: number): Promise<Cart | null>
    findAbandoned(): Promise<Cart[]>
    save(cart: Cart): Promise<void>
    delete(id: number): Promise<void>
}