const express = require("express");
const prisma = require("../config/db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
router.use(authenticate);

router.get("/", async (req, res) => {
  const now = new Date();

  const baseWhere =
    req.user.role === "ADMIN"
      ? {}
      : {
          OR: [
            { assigneeId: req.user.id },
            { creatorId: req.user.id },
            { project: { ownerId: req.user.id } },
            { project: { members: { some: { userId: req.user.id } } } },
          ],
        };

  const [allTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: baseWhere }),
    prisma.task.count({ where: { ...baseWhere, status: "TODO" } }),
    prisma.task.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    prisma.task.count({ where: { ...baseWhere, status: "DONE" } }),
    prisma.task.count({
      where: {
        ...baseWhere,
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
    }),
  ]);

  return res.json({
    tasks: {
      all: allTasks,
      todo: todoTasks,
      inProgress: inProgressTasks,
      done: doneTasks,
      overdue: overdueTasks,
    },
  });
});

module.exports = router;
