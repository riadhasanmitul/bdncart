const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepo = require('./auth.repository');
const { ConflictError, UnauthorizedError } = require('../../shared/errors/AppError');
const { env } = require('../../shared/config/env');
const { redisClient } = require('../../shared/config/redis');

/**
 * ─────────────────────────────────────────────────────────────────
 * LAYER: SERVICE
 * ─────────────────────────────────────────────────────────────────
 * WHY: This contains pure business logic. It doesn't know about HTTP (req/res)
 * and it doesn't write raw SQL. It just orchestrates rules.
 */

// Helper to generate both tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    role: user.role
  };

  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn
  });

  const refreshToken = jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn
  });

  return { accessToken, refreshToken };
};

async function registerUser(data) {
  // 1. Check if user already exists
  const existingUser = await authRepo.findUserByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('Email is already registered');
  }

  // 2. Hash password (10 rounds of salt is industry standard)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(data.password, salt);

  // 3. Create user in DB
  const newUser = await authRepo.createUser({
    ...data,
    passwordHash
  });

  // 4. Generate tokens
  const tokens = generateTokens(newUser);

  // 5. Store refresh token in Redis (Whitelist approach)
  // This allows us to revoke access immediately if needed.
  // E.g. redisKey: `refresh_token:${newUser.id}`
  await redisClient.setEx(
    `refresh_token:${newUser.id}`,
    7 * 24 * 60 * 60, // 7 days in seconds
    tokens.refreshToken
  );

  return { user: newUser, ...tokens };
}

async function loginUser(email, password) {
  // 1. Find user
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 2. Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 3. Generate tokens
  const tokens = generateTokens(user);

  // 4. Store refresh token in Redis
  await redisClient.setEx(
    `refresh_token:${user.id}`,
    7 * 24 * 60 * 60,
    tokens.refreshToken
  );

  // Return user without password hash
  const { password_hash, first_name, last_name, ...userWithoutPassword } = user;
  const userToReturn = {
    ...userWithoutPassword,
    firstName: first_name,
    lastName: last_name
  };
  
  return { user: userToReturn, ...tokens };
}

async function logoutUser(userId) {
  // Deleting the refresh token from Redis effectively logs them out
  // Their access token will still work, but only for 15 minutes max.
  await redisClient.del(`refresh_token:${userId}`);
}

async function refreshTokens(oldRefreshToken) {
  try {
    // 1. Verify token signature
    const decoded = jwt.verify(oldRefreshToken, env.jwt.refreshSecret);
    
    // 2. Check if token exists in Redis (Whitelist)
    const storedToken = await redisClient.get(`refresh_token:${decoded.id}`);
    if (storedToken !== oldRefreshToken) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // 3. Fetch user to ensure they still exist and aren't banned
    const user = await authRepo.findUserById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    // 4. Generate new tokens (Token Rotation)
    const tokens = generateTokens(user);
    
    // 5. Update token in Redis
    await redisClient.setEx(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      tokens.refreshToken
    );

    return tokens;
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshTokens
};
