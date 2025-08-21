import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { register, login, logout, refreshToken, getMe, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

// Authentication endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Password validation endpoint
router.post('/validate-password', (req: Request, res: Response): void => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password is required'
      });
      return;
    }

    const isValid = password && password.length > 0;

    res.json({
      success: true,
      data: {
        isValid,
        errors: isValid ? [] : ['Password is required']
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password validation failed'
    });
  }
});

export default router;