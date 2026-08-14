import { User } from "@/domain/user/entities/user";
import { Address } from "../entities/address";

export interface UserRepository {
    findAll(): Promise<User[]>
    findById(id: number): Promise<User | null>
    findByEmail(email: string): Promise<User | null>
    registerUser(user: User): Promise<void>
    deleteUser(id: number): Promise<void>
}