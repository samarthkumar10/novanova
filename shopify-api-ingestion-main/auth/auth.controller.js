import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import CustomError from '../utils/custom_error.js';

class AuthController {
  static async register(req, res) {
    try {
      const { email, password, tenantName, shopifyStore, accessToken } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new CustomError("User already exists", 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create tenant and user in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            name: tenantName,
            shopifyStore,
            accessToken
          }
        });

        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            tenantId: tenant.id
          }
        });

        return { tenant, user };
      });

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: result.user.id, 
          tenantId: result.tenant.id,
          email: result.user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          tenantId: result.tenant.id
        }
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(error.statusCode || 500).json({ 
        error: error.message || "Registration failed" 
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user with tenant
      const user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
      });

      if (!user) {
        throw new CustomError("Invalid credentials", 401);
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new CustomError("Invalid credentials", 401);
      }

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          tenantId: user.tenantId,
          email: user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          tenant: user.tenant
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(error.statusCode || 500).json({ 
        error: error.message || "Login failed" 
      });
    }
  }
}