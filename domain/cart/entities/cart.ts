import { CartItem } from "./cartItem";
import { CartStatus } from "./cartStatus";

export class Cart {
    constructor(
        public id: number,
        public userId: number | null,
        public items: CartItem[],
        public abandonedAt: Date | null,
        public status: CartStatus,
        public createdAt: Date,
        public updatedAt: Date
    ){}
    
}