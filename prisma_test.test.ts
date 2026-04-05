import { prisma } from './infrastructure/db/prismaClient';
describe('Prisma Test', () => {
    it('should initialize prisma', () => {
        expect(prisma).toBeDefined();
    });
});
