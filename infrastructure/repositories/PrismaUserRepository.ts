import { User } from "@/domain/user/entities/user";
import { UserRepository } from "@/domain/user/repository/user-repository";
import { prisma } from "../db/prismaClient";
import { Role } from "@/domain/user/entities/role";

export class PrismaUserRepository implements UserRepository {

    private mapToUser(user: any): User { // eslint-disable-line @typescript-eslint/no-explicit-any -- accesses fields not present on the generated Prisma User type
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

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({ where: { email } })
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
                    phone: user.phone ?? undefined
                }
            })
        }
    }

    async deleteUser(id: number): Promise<void> {
        const existing = await this.findById(id);
        if (existing != null) {
            await prisma.user.delete({ where: { id } })
        } else {
            throw new Error("El usuario no existe.")
        }
    }
}
