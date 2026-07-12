import { asyncHandler } from '../../lib/asyncHandler.js';
import { unauthorized } from '../../lib/errors.js';
import { authService } from './auth.service.js';

export const authController = {
  signup: asyncHandler(async (req, res) => {
    const user = await authService.signup(req.body);
    res.status(201).json({ user });
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),

  me: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    const user = await authService.me(req.user.id);
    res.json({ user });
  }),

  forgotPassword: asyncHandler(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res.json({ ok: true }); // always 200
  }),
};
