import { registerUser } from "../register-user";

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(async (pw: string) => `hashed_${pw}`),
}));

describe("registerUser use-case", () => {
  const mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    registerUser: jest.fn(),
    deleteUser: jest.fn(),
    addItem: jest.fn(),
    mergeItems: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findByUserId: jest.fn(),
    findAbandoned: jest.fn(),
  };

  const mockOrderRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUser: jest.fn(),
    addOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
    findManyByEmailAndNullUserId: jest.fn(),
    updateUserIdByEmail: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a user with hashed password and USER role", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 1,
      email: "new@example.com",
      password: "hashed_securePass123",
      firstName: "Ana",
      lastName: "Garcia",
      role: "USER",
    });
    mockOrderRepository.findManyByEmailAndNullUserId.mockResolvedValue([]);

    const result = await registerUser(
      mockUserRepository,
      { email: "new@example.com", password: "securePass123", firstName: "Ana", lastName: "Garcia" },
      mockOrderRepository
    );

    expect(result.success).toBe(true);
    expect(result.user?.email).toBe("new@example.com");
    expect(result.user?.role).toBe("USER");
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        password: "hashed_securePass123",
        role: "USER",
      })
    );
  });

  it("should reject duplicate email", async () => {
    mockUserRepository.findByEmail.mockResolvedValue({ id: 1, email: "existing@example.com" });

    const result = await registerUser(
      mockUserRepository,
      { email: "existing@example.com", password: "securePass123" },
      mockOrderRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("El email ya está registrado");
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it("should reject weak password (less than 8 chars)", async () => {
    const result = await registerUser(
      mockUserRepository,
      { email: "new@example.com", password: "short" },
      mockOrderRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("contraseña");
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it("should reject invalid email", async () => {
    const result = await registerUser(
      mockUserRepository,
      { email: "not-an-email", password: "securePass123" },
      mockOrderRepository
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("email");
  });

  it("should promote to ADMIN when email matches ADMIN_EMAIL", async () => {
    const originalAdmin = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = "admin@titania.com";

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 1,
      email: "admin@titania.com",
      password: "hashed_securePass123",
      role: "ADMIN",
    });
    mockOrderRepository.findManyByEmailAndNullUserId.mockResolvedValue([]);

    const result = await registerUser(
      mockUserRepository,
      { email: "admin@titania.com", password: "securePass123" },
      mockOrderRepository
    );

    expect(result.success).toBe(true);
    expect(result.user?.role).toBe("ADMIN");

    process.env.ADMIN_EMAIL = originalAdmin;
  });

  it("should link past guest orders with matching email", async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue({
      id: 1,
      email: "guest@example.com",
      password: "hashed_securePass123",
      role: "USER",
    });
    mockOrderRepository.findManyByEmailAndNullUserId.mockResolvedValue([
      { id: 10, email: "guest@example.com", userId: null },
      { id: 11, email: "guest@example.com", userId: null },
    ]);
    mockOrderRepository.updateUserIdByEmail.mockResolvedValue({ count: 2 });

    const result = await registerUser(
      mockUserRepository,
      { email: "guest@example.com", password: "securePass123" },
      mockOrderRepository
    );

    expect(result.success).toBe(true);
    expect(mockOrderRepository.findManyByEmailAndNullUserId).toHaveBeenCalledWith("guest@example.com");
    expect(mockOrderRepository.updateUserIdByEmail).toHaveBeenCalledWith("guest@example.com", 1);
  });
});
