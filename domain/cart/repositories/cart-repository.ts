import { Cart } from "../entities/cart"

export interface CartItemInput {
    productId: number
    quantity: number
    variantId?: number | null
}

export interface CartRepository {
    findAll(): Promise<Cart[]>
    findById(id: number): Promise<Cart | null>
    findByUserId(userId: number): Promise<Cart | null>
    findAbandoned(): Promise<Cart[]>
    save(cart: Cart): Promise<void>
    delete(id: number): Promise<void>
    addItem(cartId: number, productId: number, quantity: number, variantId: number | null): Promise<void>
    mergeItems(cartId: number, items: CartItemInput[]): Promise<void>
}