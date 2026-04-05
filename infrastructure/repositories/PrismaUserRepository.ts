import { User } from "@/domain/user/entities/user";
import { UserRepository } from "@/domain/user/repository/user-repository";
import { prisma } from "../db/prismaClient";
import { Role } from "@/domain/user/entities/role";
import { Address } from "@/domain/user/entities/address";

export class PrismaUserRepository implements UserRepository {

    private mapToUser(user: any): User {
        return new User(
            user.id,
            user.email,
            user.passwordHash,
            user.firstName,
            user.lastName,
            user.role,
            user.createdAt,
            user.updatedAt,
            user.comments || [],
            user.cart,
            user.phone,
            user.address,
            user.country,
            user.zipCode,
        );
    }

    async findAll(): Promise<User[]> {
        return (await prisma.user.findMany()).map(u => this.mapToUser(u))
    }

    async findById(id: number): Promise<User | null> {
        const user = await prisma.user.findUnique({ where: { id } })
        return user ? this.mapToUser(user) : null
    }

    async registerUser(user: User): Promise<void> {
        if (user != null) {
            await prisma.user.create({
                data: {
                    email: user.email,
                    passwordHash: user.password,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: Role.USER,
                    phone: user.phone
                }
            })
        }
    }

    async deleteUser(id: number): Promise<void> {
        if (id != null && this.findById(id) != null) {
            await prisma.user.delete({ where: { id } })
        } else {
            throw new Error("El usuario no existe.")
        }
    }

    async findByCity(address: Address): Promise<User[]> {
        let product = await prisma.user.findMany({ where: { address: address.city } })
        return product.map(u => this.mapToUser(u))
    }
}