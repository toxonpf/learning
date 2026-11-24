import dotenv from 'dotenv';
dotenv.config({ path: '.env.test', quiet: true });
process.env.NODE_ENV = 'test';
export default { testEnvironment: 'node', transform: {}, clearMocks: true, testMatch: ['**/tests/**/*.test.js'] };
