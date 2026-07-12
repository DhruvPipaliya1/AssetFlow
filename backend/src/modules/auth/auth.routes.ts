import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authMiddleware } from '../../middleware/auth.js';
import { authController } from './auth.controller.js';
import { signupSchema, loginSchema, forgotPasswordSchema } from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), authController.signup);
authRouter.post('/login', validate(loginSchema), authController.login);
authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.get('/me', authMiddleware, authController.me);
