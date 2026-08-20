type WishlistItemProps = {
    id: number
    userId: number
    productId: number
}

export class WishlistItem {
    public readonly id: number
    public readonly userId: number
    public readonly productId: number

    constructor(props: WishlistItemProps) {
        this.id = props.id
        this.userId = props.userId
        this.productId = props.productId
    }
}
