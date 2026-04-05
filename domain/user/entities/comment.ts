export class Comment {
    constructor(
        readonly id: number,
        readonly productId: number,
        readonly userId: number,
        readonly rating: number,
        readonly comment: string,
        readonly createdAt: Date,
        readonly updatedAt: Date
    ){}
}