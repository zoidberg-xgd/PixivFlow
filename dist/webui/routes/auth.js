"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const terminal_login_1 = require("../../terminal-login");
const config_1 = require("../../config");
const login_helper_1 = require("../../utils/login-helper");
const logger_1 = require("../../logger");
const router = (0, express_1.Router)();
/**
 * GET /api/auth/status
 * Get authentication status
 */
router.get('/status', async (req, res) => {
    try {
        const configPath = (0, config_1.getConfigPath)();
        const config = (0, config_1.loadConfig)(configPath);
        const hasToken = !!config.pixiv?.refreshToken;
        res.json({
            authenticated: hasToken,
            hasToken,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get auth status', { error });
        res.status(500).json({ error: 'Failed to get auth status' });
    }
});
/**
 * POST /api/auth/login
 * Login to Pixiv
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password, headless = true } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required',
            });
        }
        const login = new terminal_login_1.TerminalLogin({
            headless: headless,
            username,
            password,
        });
        const loginInfo = await login.login({
            headless: headless,
            username,
            password,
        });
        // Update config with refresh token
        const configPath = (0, config_1.getConfigPath)();
        try {
            await (0, login_helper_1.updateConfigWithToken)(configPath, loginInfo.refresh_token);
        }
        catch (error) {
            logger_1.logger.warn('Login successful but config update failed', { error });
        }
        res.json({
            success: true,
            accessToken: loginInfo.access_token,
            refreshToken: loginInfo.refresh_token,
            expiresIn: loginInfo.expires_in,
            user: loginInfo.user,
        });
    }
    catch (error) {
        logger_1.logger.error('Login failed', { error });
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
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            // Try to get from config
            const configPath = (0, config_1.getConfigPath)();
            const config = (0, config_1.loadConfig)(configPath);
            const token = config.pixiv?.refreshToken;
            if (!token) {
                return res.status(400).json({
                    error: 'Refresh token is required',
                });
            }
            const loginInfo = await terminal_login_1.TerminalLogin.refresh(token);
            res.json({
                success: true,
                accessToken: loginInfo.access_token,
                refreshToken: loginInfo.refresh_token,
                expiresIn: loginInfo.expires_in,
            });
        }
        else {
            const loginInfo = await terminal_login_1.TerminalLogin.refresh(refreshToken);
            res.json({
                success: true,
                accessToken: loginInfo.access_token,
                refreshToken: loginInfo.refresh_token,
                expiresIn: loginInfo.expires_in,
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Token refresh failed', { error });
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
router.post('/logout', async (req, res) => {
    try {
        // In a real implementation, you might want to invalidate the token
        // For now, we just return success
        res.json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        logger_1.logger.error('Logout failed', { error });
        res.status(500).json({ error: 'Logout failed' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map