// Mock prisma client BEFORE any imports — isolates tests from live DB
const fakeUsers: Array<{
  id: number;
  email: string;
  emailVerified: Date | null;
  firstName: string | null;
  lastName: string | null;
  passwordHash: string | null;
  role: string;
  phone: string | null;
  mailing: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = [];

const mockPrismaUser = {
  findMany: jest.fn(async () => [...fakeUsers]),
  findUnique: jest.fn(async ({ where }: { where: { id?: number; email?: string } }) => {
    if (where.id !== undefined) return fakeUsers.find((u) => u.id === where.id) ?? null;
    if (where.email !== undefined) return fakeUsers.find((u) => u.email === where.email) ?? null;
    return null;
  }),
  create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
    const id = fakeUsers.length + 1;
    const newUser = {
      id,
      email: (data.email as string) ?? "",
      emailVerified: (data.emailVerified as Date) ?? null,
      firstName: (data.firstName as string) ?? null,
      lastName: (data.lastName as string) ?? null,
      passwordHash: (data.passwordHash === undefined ? null : data.passwordHash) as string | null,
      role: (data.role as string) ?? "USER",
      phone: (data.phone as string) ?? null,
      mailing: (data.mailing as boolean) ?? false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    fakeUsers.push(newUser);
    return newUser;
  }),
  delete: jest.fn(async ({ where }: { where: { id: number } }) => {
    const idx = fakeUsers.findIndex((u) => u.id === where.id);
    if (idx === -1) throw new Error("Record to delete not found.");
    const [deleted] = fakeUsers.splice(idx, 1);
    return deleted;
  }),
  update: jest.fn(async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
    const idx = fakeUsers.findIndex((u) => u.id === where.id);
    if (idx === -1) throw new Error("Record to update not found.");
    fakeUsers[idx] = { ...fakeUsers[idx], ...data, updatedAt: new Date() };
    return fakeUsers[idx];
  }),
};

jest.mock("@/infrastructure/db/prismaClient", () => ({
  prisma: { user: mockPrismaUser },
}));

import { PrismaUserRepository } from "../PrismaUserRepository";
import { User } from "@/domain/user/entities/user";
import { Role } from "@/domain/user/entities/role";

describe("PrismaUserRepository", () => {
  let repo: PrismaUserRepository;

  beforeEach(() => {
    fakeUsers.length = 0;
    jest.clearAllMocks();
    repo = new PrismaUserRepository();
  });

  describe("registerUser", () => {
    it("should register and retrieve users correctly", async () => {
      const mockUser = new User(0, "test@titania.com", "hashed123", "Juan", "Perez", Role.USER);
      await repo.registerUser(mockUser);

      const allUsers = await repo.findAll();
      expect(allUsers.length).toBe(1);
      expect(allUsers[0].email).toBe("test@titania.com");

      const foundUser = await repo.findById(allUsers[0].id);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe("test@titania.com");
    });

    it("should create a user with null passwordHash (OAuth user)", async () => {
      const oauthUser = new User(0, "oauth@titania.com", null as unknown as string, null, null, Role.USER);
      await repo.registerUser(oauthUser);

      const allUsers = await repo.findAll();
      expect(allUsers[0].password).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should return a user when email exists", async () => {
      fakeUsers.push({
        id: 1, email: "find@example.com", emailVerified: null,
        firstName: "Ana", lastName: "Garcia", passwordHash: "hash",
        role: "USER", phone: null, mailing: false,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });

      const user = await repo.findByEmail("find@example.com");
      expect(user).not.toBeNull();
      expect(user?.email).toBe("find@example.com");
    });

    it("should return null when email does not exist", async () => {
      const user = await repo.findByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("deleteUser", () => {
    it("should delete an existing user", async () => {
      fakeUsers.push({
        id: 1, email: "delete@example.com", emailVerified: null,
        firstName: null, lastName: null, passwordHash: "hash",
        role: "USER", phone: null, mailing: false,
        isDeleted: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      });

      await repo.deleteUser(1);
      const result = await repo.findById(1);
      expect(result).toBeNull();
    });

    it("should throw when user does not exist", async () => {
      await expect(repo.deleteUser(999)).rejects.toThrow("El usuario no existe.");
    });
  });

  describe("findById", () => {
    it("should return null for non-existent id", async () => {
      const user = await repo.findById(999);
      expect(user).toBeNull();
    });
  });
});
