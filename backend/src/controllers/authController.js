const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const {
  requireEmail,
  requireString,
  requireStrongPassword,
} = require('../utils/validate');

const SALT_ROUNDS = 10;

/** Removes the password hash before a user object is sent to the client. */
function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

/** Creates a signed JWT for a user. */
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}


async function login(req, res) {
  const email = requireEmail(req.body.email);
  const password = requireString(req.body.password, 'Password');

  const user = await prisma.user.findUnique({ where: { email } });

 
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user: publicUser(user) });
}

async function register(req, res) {
  const fullName = requireString(req.body.fullName, 'Full name');
  const membershipId = requireString(req.body.membershipId, 'Membership ID');
  const email = requireEmail(req.body.email);
  const password = requireStrongPassword(req.body.password);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { membershipId }] },
  });
  if (existing) {
    throw new ApiError(409, 'An account with that email or membership ID already exists');
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      membershipId,
      email,
      password: await bcrypt.hash(password, SALT_ROUNDS),
      role: 'USER',
    },
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

async function me(req, res) {
  res.json({ user: req.user });
}

async function changePassword(req, res) {
  const currentPassword = requireString(req.body.currentPassword, 'Current password');
  const newPassword = requireStrongPassword(req.body.newPassword, 'New password');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new ApiError(404, 'Account not found');
  }

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw new ApiError(400, 'Your current password is incorrect');
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    throw new ApiError(400, 'The new password must be different from the current one');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await bcrypt.hash(newPassword, SALT_ROUNDS),
      mustChangePassword: false,
    },
  });

  res.json({ message: 'Password updated successfully', user: publicUser(updated) });
}

module.exports = { login, register, me, changePassword, publicUser };
