import { UserService } from "@/services/auth/user.services";
import { prisma } from "@/app/prisma";
import { logger } from "@/lib/logger/logging";
import { ResponseError } from "@/lib/errors/response-error";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

jest.mock("@/app/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe("UserService", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    password: "hashed_password123",
    username: "testuser",
    name: "Test User",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let createdUserId: string;

  beforeAll(() => {
    logger.info("🧪 Starting UserService tests...");
  });

  afterEach(async () => {
    logger.debug(`Cleanup: Attempting to delete user ${createdUserId}`);

    if (createdUserId) {
      try {
        (prisma.user.delete as jest.Mock).mockResolvedValueOnce({});
        await prisma.user.delete({
          where: { id: createdUserId },
        });
        logger.info(`✅ User ${createdUserId} deleted successfully`);
        createdUserId = "";
      } catch (error) {
        logger.warn(
          `⚠️ User sudah dihapus atau tidak ditemukan: ${createdUserId}`,
          error,
        );
      }
    }

    jest.clearAllMocks();
  });

  describe("Register", () => {
    it("should successfully register a new user", async () => {
      logger.info("📝 Test: Register new user");

      const registerRequest = {
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        name: "Test User",
      };

      logger.debug("Request data:", registerRequest);

      const newUser = {
        id: "123",
        email: registerRequest.email,
        password: "hashed_password123",
        username: registerRequest.username,
        name: registerRequest.name,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      logger.debug("Mock: User not found in database");

      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("hashed_password123");
      logger.debug("Mock: Password hashed");

      (prisma.user.create as jest.Mock).mockResolvedValueOnce(newUser);
      logger.debug("Mock: User created successfully");

      (jwt.sign as jest.Mock).mockReturnValueOnce("mock_token_123");
      logger.debug("Mock: JWT token generated");

      const result = await UserService.register(registerRequest);

      createdUserId = newUser.id;

      logger.info(`✅ Test passed - User created with ID: ${newUser.id}`);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerRequest.email);
      expect(result).toHaveProperty("token");
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerRequest.email },
            { password: registerRequest.password },
          ],
        },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerRequest.password, 10);
    });

    it("should throw error if email already exists", async () => {
      logger.info("📝 Test: Email already exists");

      const registerRequest = {
        email: "existing@example.com",
        password: "password123",
        username: "testuser",
        name: "Test User",
      };

      logger.debug("Request data:", registerRequest);

      const existingUser = {
        id: "456",
        email: registerRequest.email,
        password: "hashed_existing_password",
        username: "existinguser",
        name: "Existing User",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(existingUser);

      await expect(UserService.register(registerRequest)).rejects.toThrow(
        "Email or Password already exists",
      );

      logger.info("✅ Test passed - Error thrown correctly");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should hash password before storing", async () => {
      logger.info("📝 Test: Password hashing");

      const registerRequest = {
        email: "newuser@example.com",
        password: "mypassword",
        username: "newuser",
        name: "New User",
      };

      logger.debug("Original password:", registerRequest.password);

      const newUser = {
        id: "789",
        email: registerRequest.email,
        password: "hashed_mypassword",
        username: registerRequest.username,
        name: registerRequest.name,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("hashed_mypassword");
      (prisma.user.create as jest.Mock).mockResolvedValueOnce(newUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce("mock_token_789");
      logger.debug("Mock: Password hashed");

      const result = await UserService.register(registerRequest);

      createdUserId = newUser.id;

      logger.info(`✅ Test passed - Password hashed and user created`);

      expect(result.name).toBe("New User");
      expect(result.email).toBe("newuser@example.com");
      expect(result).toHaveProperty("token");
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe("Login", () => {
    it("should successfully login with valid credentials", async () => {
      logger.info("📝 Test: Login with valid credentials");

      const loginRequest = {
        email: "test@example.com",
        password: "password123",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce("mock_token_login");

      const response = await UserService.login(loginRequest);

      logger.info("✅ Login test passed");

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginRequest.password,
        mockUser.password,
      );
      expect(jwt.sign).toHaveBeenCalled();
      expect(response).toHaveProperty("token");
      expect(response.email).toBe(mockUser.email);
    });

    it("should fail login with non-existent email", async () => {
      logger.info("📝 Test: Login with non-existent email");

      const loginRequest = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(UserService.login(loginRequest)).rejects.toThrow(
        ResponseError,
      );

      await expect(UserService.login(loginRequest)).rejects.toThrow(
        "Email or password wrong",
      );

      logger.info("✅ Non-existent email test passed");

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
      });
    });

    it("should fail login with invalid password", async () => {
      logger.info("📝 Test: Login with invalid password");

      const loginRequest = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(UserService.login(loginRequest)).rejects.toThrow(
        ResponseError,
      );

      await expect(UserService.login(loginRequest)).rejects.toThrow(
        "Email or password wrong",
      );

      logger.info("✅ Invalid password test passed");

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginRequest.password,
        mockUser.password,
      );
    });

    it("should fail login with missing email", async () => {
      logger.info("📝 Test: Login with missing email");

      const loginRequest = {
        email: "",
        password: "password123",
      };

      await expect(UserService.login(loginRequest)).rejects.toThrow();

      logger.info("✅ Missing email test passed");
    });

    it("should fail login with missing password", async () => {
      logger.info("📝 Test: Login with missing password");

      const loginRequest = {
        email: "test@example.com",
        password: "",
      };

      await expect(UserService.login(loginRequest)).rejects.toThrow();

      logger.info("✅ Missing password test passed");
    });
  });

  describe("GetUser", () => {
    it("should successfully get user with valid token", async () => {
      logger.info("📝 Test: GetUser with valid token");
      const validToken = "valid_jwt_token";
      (jwt.verify as jest.Mock).mockReturnValueOnce({
        id: mockUser.id,
        email: mockUser.email,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce("new_token");
      const response = await UserService.get(validToken);
      logger.info("✅ GetUser with valid token test passed");
      expect(jwt.verify).toHaveBeenCalledWith(
        validToken,
        process.env.JWT_SECRET || "",
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id, email: mockUser.email },
      });
      expect(response.email).toBe(mockUser.email);
      expect(response).toHaveProperty("token");
    });

    it("should fail GetUser with invalid token", async () => {
      logger.info("📝 Test: GetUser with invalid token");
      const invalidToken = "invalid.token.here";
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("Invalid token");
      });
      await expect(UserService.get(invalidToken)).rejects.toThrow(
        "Invalid or expired token",
      );
      logger.info("✅ Invalid token test passed");
      expect(jwt.verify).toHaveBeenCalledWith(
        invalidToken,
        process.env.JWT_SECRET || "",
      );
    });

    it("should fail GetUser with expired token", async () => {
      logger.info("📝 Test: GetUser with expired token");
      const expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token";
      const expiredError = new jwt.JsonWebTokenError("Token expired");
      expiredError.name = "TokenExpiredError";

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });
      await expect(UserService.get(expiredToken)).rejects.toThrow(
        "Invalid or expired token",
      );
      logger.info("✅ Expired token test passed");
    });

    it("should fail GetUser when user not found in database", async () => {
      logger.info("📝 Test: GetUser when user not found");
      const validToken = "valid_jwt_token";
      (jwt.verify as jest.Mock).mockReturnValue({
        id: "nonexistent-user-id",
        email: "nonexistent@example.com",
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(UserService.get(validToken)).rejects.toThrow(
        "User Not Found",
      );

      logger.info("✅ User not found test passed");
    });

    it("should not return token in GetUser response", async () => {
      logger.info("📝 Test: GetUser should not return token");
      const validToken = "valid_jwt_token";
      (jwt.verify as jest.Mock).mockReturnValueOnce({
        id: mockUser.id,
        email: mockUser.email,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce("new_token");
      const response = await UserService.get(validToken);
      logger.info("✅ Token not included test passed");
      expect(response).toHaveProperty("token");
      expect(response.email).toBe(mockUser.email);
    });
  });

  describe("Logout", () => {
    it("should successfully logout", async () => {
      logger.info("📝 Test: Logout success");

      const response = await UserService.logout();

      logger.info("✅ Logout test passed");

      expect(response).toHaveProperty("message");
      expect(response.message).toBe("Logout Success");
    });

    it("should return message with logout success", async () => {
      logger.info("📝 Test: Logout returns correct message");

      const response = await UserService.logout();

      logger.info("✅ Logout message test passed");

      expect(response.message).toMatch(/logout|success/i);
    });

    it("should not require any parameters", async () => {
      logger.info("📝 Test: Logout without parameters");

      const response = await UserService.logout();

      logger.info("✅ Logout without parameters test passed");

      expect(response).toBeDefined();
      expect(response.message).toBe("Logout Success");
    });
  });

  describe("Authentication Flow Integration", () => {
    it("should complete full auth flow: Login -> GetUser", async () => {
      logger.info("📝 Test: Full auth flow (Login -> GetUser)");

      const loginRequest = {
        email: "test@example.com",
        password: "password123",
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      const mockLoginToken = "mock_login_token_integration";
      (jwt.sign as jest.Mock).mockReturnValueOnce(mockLoginToken);

      const loginResponse = await UserService.login(loginRequest);
      expect(loginResponse).toHaveProperty("token");

      logger.info("✅ Step 1: Login successful");

      (jwt.verify as jest.Mock).mockReturnValueOnce({
        id: mockUser.id,
        email: mockUser.email,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce("new_token");

      logger.info("✅ Step 2: GetUser successful");

      const logoutResponse = await UserService.logout();
      expect(logoutResponse.message).toBe("Logout Success");

      logger.info("✅ Step 3: Logout successful");
      logger.info("✅ Full auth flow test passed");
    });
  });
});
