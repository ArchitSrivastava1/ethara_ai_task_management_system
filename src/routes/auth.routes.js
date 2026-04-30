const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const validate = require("../middleware/validators");
const { authSignupSchema, authLoginSchema } = require("../services/schemas");

const router = express.Router();

router.post("/signup", validate(authSignupSchema), async (req, res) => {
  const { name, email, password, role } = req.validated.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || "MEMBER",
    },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.status(201).json({ user, token });
});

router.post("/login", validate(authLoginSchema), async (req, res) => {
  const { email, password } = req.validated.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
