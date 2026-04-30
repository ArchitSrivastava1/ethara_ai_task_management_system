const express = require("express");
const prisma = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validators");
const { createProjectSchema, idParamSchema, addProjectMemberSchema } = require("../services/schemas");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";

  const projects = await prisma.project.findMany({
    where: isAdmin
      ? {}
      : {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } },
          ],
        },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(projects);
});

router.post("/", requireRole("ADMIN"), validate(createProjectSchema), async (req, res) => {
  const { name, description, memberIds = [] } = req.validated.body;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId: req.user.id,
      members: {
        create: memberIds
          .filter((id) => id !== req.user.id)
          .map((userId) => ({ userId })),
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return res.status(201).json(project);
});

router.get("/:id", validate(idParamSchema), async (req, res) => {
  const { id } = req.validated.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const hasAccess =
    req.user.role === "ADMIN" ||
    project.ownerId === req.user.id ||
    project.members.some((m) => m.userId === req.user.id);
  if (!hasAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(project);
});

router.post(
  "/:id/members",
  requireRole("ADMIN"),
  validate(addProjectMemberSchema),
  async (req, res) => {
    const { id } = req.validated.params;
    const { userId } = req.validated.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      update: {},
      create: { projectId: id, userId },
    });

    return res.status(201).json(member);
  }
);

module.exports = router;
