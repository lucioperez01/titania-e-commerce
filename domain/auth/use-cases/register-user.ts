import bcrypt from "bcrypt";
import { User } from "@/domain/user/entities/user";
import { Role } from "@/domain/user/entities/role";

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: { id: number; email: string; role: string };
  error?: string;
}

// Minimal repository interface for this use-case
export interface RegisterUserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: Partial<User> & { email: string; password: string; role: Role }): Promise<{ id: number; email: string; role: string }>;
}

export interface LinkOrdersRepository {
  findManyByEmailAndNullUserId(email: string): Promise<Array<{ id: number; email: string; userId: number | null }>>;
  updateUserIdByEmail(email: string, userId: number): Promise<{ count: number }>;
}

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 10;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUser(
  userRepository: RegisterUserRepository,
  input: RegisterInput,
  orderRepository: LinkOrdersRepository
): Promise<RegisterResult> {
  // Validate email
  if (!isValidEmail(input.email)) {
    return { success: false, error: "El email no es válido" };
  }

  // Validate password strength
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return { success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` };
  }

  // Check for duplicate email
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    return { success: false, error: "El email ya está registrado" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Determine role (admin auto-promotion)
  const adminEmails = process.env.ADMIN_EMAIL?.split(",") ?? [];
  const role = adminEmails.includes(input.email) ? Role.ADMIN : Role.USER;

  // Create user
  const created = await userRepository.create({
    email: input.email,
    password: passwordHash,
    firstName: input.firstName ?? undefined,
    lastName: input.lastName ?? undefined,
    phone: input.phone ?? undefined,
    role,
  });

  // Link past guest orders
  const guestOrders = await orderRepository.findManyByEmailAndNullUserId(input.email);
  if (guestOrders.length > 0) {
    await orderRepository.updateUserIdByEmail(input.email, created.id);
  }

  return {
    success: true,
    user: { id: created.id, email: created.email, role: created.role },
  };
}
