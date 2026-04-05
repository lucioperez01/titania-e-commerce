export class Variant {
    constructor(
        public id: number,
        public productId: number,
        public price: number,
        public stock: number,
        public reservedStock: number = 0,
        public sku: string,
        public attributes: Record<string, any>,
        public createdAt: Date,
        public updatedAt: Date,
        public weight?: number,
    ){}
}