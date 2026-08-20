export interface WishlistRepository {
    findByUserId(userId: number): Promise<number[]>
    add(userId: number, productId: number): Promise<void>
    remove(userId: number, productId: number): Promise<void>
    exists(userId: number, productId: number): Promise<boolean>
    countByUserId(userId: number): Promise<number>
}
