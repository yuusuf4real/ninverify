import "@testing-library/jest-dom";

// Mock environment variables for testing
process.env.AUTH_SECRET = "test-secret-key-for-jwt-signing-in-tests-only";
process.env.ENCRYPTION_KEY = "dGVzdC1lbmNyeXB0aW9uLWtleS1mb3ItdGVzdHMtb25seQ==";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV = "test";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/test";
  },
}));

// Mock database
jest.mock("@/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    execute: jest.fn(),
  },
}));

// Global test utilities
global.mockRequest = (overrides = {}) => ({
  headers: new Map([
    ["content-type", "application/json"],
    ["user-agent", "Mozilla/5.0 (Test Browser)"],
    ["x-forwarded-for", "192.168.1.1"],
    ...Object.entries(overrides.headers || {}),
  ]),
  nextUrl: { pathname: "/api/test" },
  method: "GET",
  ...overrides,
});

global.mockResponse = () => ({
  headers: new Map(),
  set: function (key, value) {
    this.headers.set(key, value);
    return this;
  },
  json: jest.fn(),
  status: jest.fn(),
});

// Suppress console logs during tests unless explicitly needed
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  jest.clearAllMocks();
});
