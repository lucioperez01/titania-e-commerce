export class CartItem {
    constructor(
        public readonly id: number,
        public readonly cartId: number,
        public readonly productId: number,
        public readonly quantity: number,
        public readonly variantId?: number | null,
        
    ){}
}