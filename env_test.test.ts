describe('Env Test', () => {
    it('should have DATABASE_URL', () => {
        console.log('DATABASE_URL is defined:', !!process.env.DATABASE_URL);
        expect(process.env.DATABASE_URL).toBeDefined();
    });
});
