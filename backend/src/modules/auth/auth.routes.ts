import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  updatePreferencesSchema,
} from './auth.schema.js';

export const authRouter = Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new account (always created as EMPLOYEE)
 *     description: Any role sent in the body is ignored — signup only ever creates an Employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, format: email, example: jane@company.com }
 *               password: { type: string, minLength: 8, example: password123 }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       400: { description: Validation error, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Email already registered, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
authRouter.post('/signup', validate(signupSchema), authController.signup);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive an access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: Invalid credentials, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
authRouter.post('/login', validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset — returns a reset token if the email exists
 *     description: Always 200 (no user enumeration). In dev the reset token is returned in the body; in production it would be emailed.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 resetToken: { type: string, nullable: true }
 */
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Set a new password using a reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password updated }
 *       400: { description: Invalid or expired token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401: { description: Unauthorized, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
authRouter.get('/me', authMiddleware, authController.me);

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update your own profile (name, avatar)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               avatarUrl: { type: string, nullable: true }
 *     responses: { 200: { description: OK }, 401: { description: Unauthorized } }
 */
authRouter.patch('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change your own password (verifies the current one)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses: { 200: { description: OK }, 400: { description: Wrong current password } }
 */
authRouter.post('/change-password', authMiddleware, validate(changePasswordSchema), authController.changePassword);

/**
 * @openapi
 * /auth/preferences:
 *   patch:
 *     tags: [Auth]
 *     summary: Update your UI preferences (theme, landing page)
 *     security: [{ bearerAuth: [] }]
 *     responses: { 200: { description: OK } }
 */
authRouter.patch('/preferences', authMiddleware, validate(updatePreferencesSchema), authController.updatePreferences);
