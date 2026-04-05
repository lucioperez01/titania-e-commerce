
import { User } from "../../../domain/user/entities/user"
import { Role } from '../../../domain/user/entities/role';
import { prisma } from '../../db/prismaClient';
import { PrismaUserRepository } from '../PrismaUserRepository';
import dotenv from "dotenv"

dotenv.config({ path: ".env" })
console.log(process.env.DATABASE_URL)

describe('PrismaUserRepository Integration Test', () => {
  const userRepository = new PrismaUserRepository();

  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should register and retrieve users correctly', async () => {
    const mockUser = new User(
      1,
      "[EMAIL_ADDRESS]",
      "123456",
      "Juan",
      "Perez",
      Role.USER,
    )

    console.log('Intentando registrar usuario:', mockUser.email);
    await userRepository.registerUser(mockUser);
    const createdUser: User | null = await userRepository.findById(mockUser.id);
    console.log('Usu77ario registrado exitosamente:', createdUser);

    expect(createdUser).not.toBeNull();
    expect(createdUser?.email).toBe(mockUser.email);

    console.log('Consultando base de datos para verificar persistencia...');
    const foundUser: User | null = await userRepository.findById(mockUser.id);
    console.log('Usuario recuperado de la consulta:', foundUser);

    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(mockUser.id);

    console.log('Probando consulta de listado general...');
    const allUsers: User[] = await userRepository.findAll();
    console.log(`Cantidad de usuarios en DB: ${allUsers.length}`);

    expect(allUsers.length).toBeGreaterThan(0);
    expect(allUsers.some(u => u.email === mockUser.email)).toBe(true);
  });
});

