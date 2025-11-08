import { Router, Request, Response } from 'express';
import { TerminalLogin } from '../../terminal-login';
import { loadConfig, getConfigPath } from '../../config';
import { updateConfigWithToken } from '../../utils/login-helper';
import { logger } from '../../logger';
import path from 'path';

const router = Router();

/**
 * GET /api/auth/status
 * Get authentication status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const configPath = getConfigPath();
    const config = loadConfig(configPath);

    const hasToken = !!config.pixiv?.refreshToken;

    res.json({
      authenticated: hasToken,
      hasToken,
    });
  } catch (error) {
    logger.error('Failed to get auth status', { error });
    res.status(500).json({ error: 'Failed to get auth status' });
  }
});

/**
 * POST /api/auth/login
 * Login to Pixiv
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password, headless = true } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const login = new TerminalLogin({
      headless: headless as boolean,
      username,
      password,
    });

    const loginInfo = await login.login({
      headless: headless as boolean,
      username,
      password,
    });

    // Update config with refresh token
    const configPath = getConfigPath();
    try {
      await updateConfigWithToken(configPath, loginInfo.refresh_token);
    } catch (error) {
      logger.warn('Login successful but config update failed', { error });
    }

    res.json({
      success: true,
      accessToken: loginInfo.access_token,
      refreshToken: loginInfo.refresh_token,
      expiresIn: loginInfo.expires_in,
      user: loginInfo.user,
    });
  } catch (error) {
    logger.error('Login failed', { error });
    res.status(401).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      // Try to get from config
      const configPath = getConfigPath();
      const config = loadConfig(configPath);
      const token = config.pixiv?.refreshToken;

      if (!token) {
        return res.status(400).json({
          error: 'Refresh token is required',
        });
      }

      const loginInfo = await TerminalLogin.refresh(token);
      res.json({
        success: true,
        accessToken: loginInfo.access_token,
        refreshToken: loginInfo.refresh_token,
        expiresIn: loginInfo.expires_in,
      });
    } else {
      const loginInfo = await TerminalLogin.refresh(refreshToken);
      res.json({
        success: true,
        accessToken: loginInfo.access_token,
        refreshToken: loginInfo.refresh_token,
        expiresIn: loginInfo.expires_in,
      });
    }
  } catch (error) {
    logger.error('Token refresh failed', { error });
    res.status(401).json({
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (clear token)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a real implementation, you might want to invalidate the token
    // For now, we just return success
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;

