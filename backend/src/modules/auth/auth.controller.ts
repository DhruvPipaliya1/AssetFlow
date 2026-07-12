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
    const { resetToken } = await authService.forgotPassword(req.body.email);
    // resetToken is surfaced here as a dev convenience (no email infra). In
    // production it would be delivered via an emailed reset link instead.
    res.json({ ok: true, resetToken });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await authService.resetPassword(req.body);
    res.json({ ok: true });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ user: await authService.updateProfile(req.user.id, req.body) });
  }),

  changePassword: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    await authService.changePassword(req.user.id, req.body);
    res.json({ ok: true });
  }),

  updatePreferences: asyncHandler(async (req, res) => {
    if (!req.user) throw unauthorized();
    res.json({ user: await authService.updatePreferences(req.user.id, req.body) });
  }),
};
