"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/infrastructure/db/prismaClient";
import { registerUser, RegisterInput } from "@/domain/auth/use-cases/register-user";
import { Role } from "@/domain/user/entities/role";
import { User } from "@/domain/user/entities/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Repository adapter for the use-case
class PrismaRegisterRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new User(
      user.id, user.email, user.passwordHash,
      user.firstName, user.lastName, user.role as Role
    );
  }

  async create(data: { email: string; password: string; firstName?: string | null; lastName?: string | null; phone?: string | null; role: Role }) {
    const created = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
      },
    });
    return { id: created.id, email: created.email, role: created.role };
  }
}

class PrismaLinkOrdersRepository {
  async findManyByEmailAndNullUserId(email: string) {
    return prisma.order.findMany({
      where: { email, userId: null },
      select: { id: true, email: true, userId: true },
    });
  }

  async updateUserIdByEmail(email: string, userId: number) {
    return prisma.order.updateMany({
      where: { email, userId: null },
      data: { userId },
    });
  }
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  const input: RegisterInput = { email, password, firstName, lastName };
  const userRepository = new PrismaRegisterRepository();
  const orderRepository = new PrismaLinkOrdersRepository();

  const result = await registerUser(userRepository, input, orderRepository);

  if (!result.success) {
    return { error: result.error };
  }

  // Sign in after registration
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch {
    // Redirect is handled by signIn
  }

  revalidatePath("/");
  redirect("/");
}
