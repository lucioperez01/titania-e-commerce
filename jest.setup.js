import dotenv from "dotenv"
dotenv.config()
module.exports = {
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"]
}