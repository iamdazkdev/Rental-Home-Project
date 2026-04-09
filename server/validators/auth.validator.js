const { z } = require("zod");

const registerSchema = {
  body: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email("Invalid email address"),
  })
};

const verifyResetTokenSchema = {
  query: z.object({
    token: z.string().min(1, "Token is required"),
  })
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, "Token is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  resetPasswordSchema
};
