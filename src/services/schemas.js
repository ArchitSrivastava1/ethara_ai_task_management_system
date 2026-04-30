const { z } = require("zod");

const roleEnum = z.enum(["ADMIN", "MEMBER"]);
const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE"]);

const authSignupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(6).max(128),
    role: roleEnum.optional(),
  }),
});

const authLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
  }),
});

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(1000).optional(),
    memberIds: z.array(z.string().min(1)).optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

const addProjectMemberSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    userId: z.string().min(1),
  }),
});

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).optional(),
    projectId: z.string().min(1),
    assigneeId: z.string().min(1).optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    status: taskStatusEnum.optional(),
  }),
});

const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z
    .object({
      title: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().max(2000).optional().nullable(),
      assigneeId: z.string().min(1).optional().nullable(),
      dueDate: z.string().datetime().optional().nullable(),
      status: taskStatusEnum.optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one field is required",
    }),
});

module.exports = {
  authSignupSchema,
  authLoginSchema,
  createProjectSchema,
  idParamSchema,
  addProjectMemberSchema,
  createTaskSchema,
  updateTaskSchema,
};
