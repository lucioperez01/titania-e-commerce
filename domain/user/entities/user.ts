import { Address } from "./address";
import { Comment } from "./comment";
import { Role } from "./role";
import { Cart } from "@/domain/cart/entities/cart";

export class User {
    constructor(
        public id: number,
        public email: string,
        public password: string,
        public firstName: string,
        public lastName: string,
        public role: Role,
        public createdAt?: Date,
        public updatedAt?: Date,
        public commnents?: Comment[],
        public cart?: Cart,
        public phone?: string,
        public address?: Address,
        public country?: string,
        public zipCode?: string,
    ) { };
}