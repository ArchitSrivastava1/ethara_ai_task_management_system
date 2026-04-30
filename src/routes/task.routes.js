const express = require("express");
const prisma = require("../config/db");
const { authenticate, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validators");
const { createTaskSchema, updateTaskSchema } = require("../services/schemas");

const router = express.Router();
router.use(authenticate);

const canAccessProject = async (projectId, user) => {
  if (user.role === "ADMIN") return true;

  const membership = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }],
    },
    select: { id: true },
  });
  return Boolean(membership);
};

router.get("/", async (req, res) => {
  const where = req.user.role === "ADMIN"
    ? {}
    : {
        OR: [
          { creatorId: req.user.id },
          { assigneeId: req.user.id },
          { project: { ownerId: req.user.id } },
          { project: { members: { some: { userId: req.user.id } } } },
        ],
      };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(tasks);
});

router.post("/", requireRole("ADMIN"), validate(createTaskSchema), async (req, res) => {
  const { title, description, projectId, assigneeId, dueDate, status } = req.validated.body;

  const hasAccess = await canAccessProject(projectId, req.user);
  if (!hasAccess) {
    return res.status(403).json({ message: "Forbidden for this project" });
  }

  if (assigneeId) {
    const user = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!user) {
      return res.status(404).json({ message: "Assignee not found" });
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || "TODO",
      creatorId: req.user.id,
    },
  });

  return res.status(201).json(task);
});

router.patch("/:id", validate(updateTaskSchema), async (req, res) => {
  const { id } = req.validated.params;
  const payload = req.validated.body;

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  const hasAccess = await canAccessProject(task.projectId, req.user);
  if (!hasAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.role !== "ADMIN") {
    const allowedForMember = Object.keys(payload).every((key) => key === "status");
    const isAssignee = task.assigneeId === req.user.id;
    if (!allowedForMember || !isAssignee) {
      return res.status(403).json({ message: "Members can only update their task status" });
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...payload,
      dueDate: payload.dueDate === undefined ? undefined : payload.dueDate ? new Date(payload.dueDate) : null,
      assigneeId: payload.assigneeId === undefined ? undefined : payload.assigneeId || null,
    },
  });

  return res.json(updated);
});

module.exports = router;
