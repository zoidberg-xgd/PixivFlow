"use strict";
/**
 * Python gppt Login Adapter
 *
 * This module provides login functionality using the pip-installed gppt package.
 * It uses the gppt package installed via `pip install gppt`.
 *
 * Requirements:
 * - Python 3.9+
 * - gppt package installed via pip: `pip install gppt`
 * - Chrome browser and ChromeDriver for Selenium
 *
 * Reference: https://github.com/eggplants/get-pixivpy-token
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPythonGpptAvailable = checkPythonGpptAvailable;
exports.installGppt = installGppt;
exports.loginWithGpptInteractive = loginWithGpptInteractive;
exports.loginWithGpptHeadless = loginWithGpptHeadless;
const child_process_1 = require("child_process");
/**
 * Check if Python and pip-installed gppt module are available
 */
async function checkPythonGpptAvailable() {
    try {
        // Check Python
        const pythonCheck = await runCommand('python3', ['--version']);
        if (!pythonCheck.success) {
            return false;
        }
        // Check if gppt module can be imported (from pip installation)
        const importScript = `
try:
    from gppt import GetPixivToken
    print("OK")
except ImportError as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
        const gpptCheck = await runPythonScript(importScript);
        return gpptCheck.success && gpptCheck.stdout.trim() === 'OK';
    }
    catch {
        return false;
    }
}
/**
 * Install gppt using pip
 */
async function installGppt() {
    try {
        console.log('[!]: Installing gppt package via pip...');
        console.log('[i]: This may take a moment...');
        // Try pip3 first, then pip
        const pipCommands = ['pip3', 'pip'];
        let pipInstalled = false;
        for (const pipCmd of pipCommands) {
            const pipCheck = await runCommand(pipCmd, ['--version']);
            if (pipCheck.success) {
                const result = await runCommand(pipCmd, ['install', 'gppt']);
                if (result.success) {
                    console.log('[+]: gppt installed successfully');
                    pipInstalled = true;
                    break;
                }
                else {
                    console.error(`[!]: Failed to install gppt using ${pipCmd}:`, result.error);
                }
            }
        }
        if (!pipInstalled) {
            console.error('[!]: Failed to install gppt. Please install manually:');
            console.error('[!]: pip install gppt');
            console.error('[!]: or');
            console.error('[!]: pip3 install gppt');
            return false;
        }
        // Verify installation
        const available = await checkPythonGpptAvailable();
        if (available) {
            console.log('[+]: gppt is ready to use');
            return true;
        }
        else {
            console.error('[!]: gppt was installed but cannot be imported');
            return false;
        }
    }
    catch (error) {
        console.error('[!]: Error installing gppt:', error);
        return false;
    }
}
/**
 * Login using Python gppt (interactive terminal mode)
 *
 * Note: Even though this is called "terminal login", gppt uses Selenium to automate
 * a browser for the login process. This function will open a visible Chrome browser
 * window where you need to manually log in. If you want to avoid opening a browser
 * window, use loginWithGpptHeadless() with username and password instead.
 *
 * Uses gppt's login-interactive command
 */
async function loginWithGpptInteractive() {
    try {
        console.log('[!]: Using Python gppt for login (interactive mode)...');
        console.log('[i]: Note: This will open a Chrome browser window for manual login.');
        console.log('[i]: To avoid opening browser, use headless mode with --username and --password');
        // Use a simple Python script to call gppt and output full JSON
        const script = `
import json
import sys
from gppt import GetPixivToken

try:
    g = GetPixivToken()
    print("[!]: Chrome browser will be launched. Please login.", file=sys.stderr)
    res = g.login()
    print("[+]: Success!", file=sys.stderr)
    print(json.dumps(res, indent=2))
except KeyboardInterrupt:
    print("ERROR: Login interrupted by user", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
        const result = await runPythonScript(script);
        // Print stderr messages (info/warnings)
        if (result.stderr) {
            const stderrLines = result.stderr.trim().split('\n');
            for (const line of stderrLines) {
                if (line && !line.includes('ERROR:')) {
                    console.log(`[i]: ${line}`);
                }
            }
        }
        if (!result.success) {
            throw new Error(result.error || 'gppt login failed');
        }
        if (!result.stdout || result.stdout.trim() === '') {
            throw new Error('No response from gppt login');
        }
        const response = JSON.parse(result.stdout);
        return convertGpptResponseToLoginInfo(response);
    }
    catch (error) {
        console.error('[!]: Python gppt login failed:', error);
        return null;
    }
}
/**
 * Login using Python gppt (headless mode)
 *
 * This mode runs the browser in the background (headless) without opening
 * a visible window. Requires username and password to be provided.
 *
 * Uses gppt's login-headless command with username and password
 */
async function loginWithGpptHeadless(username, password) {
    try {
        console.log('[!]: Using Python gppt for login (headless mode - no browser window)...');
        // Check for proxy configuration (check both uppercase and lowercase)
        const allProxy = process.env.ALL_PROXY || process.env.all_proxy;
        const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
        const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
        const hasProxy = allProxy || httpsProxy || httpProxy;
        if (hasProxy) {
            console.log('[i]: Proxy configuration detected:');
            if (allProxy)
                console.log(`[i]:   ALL_PROXY/all_proxy: ${allProxy}`);
            if (httpsProxy)
                console.log(`[i]:   HTTPS_PROXY/https_proxy: ${httpsProxy}`);
            if (httpProxy)
                console.log(`[i]:   HTTP_PROXY/http_proxy: ${httpProxy}`);
            console.log('[i]: Python script will verify proxy detection...');
        }
        else {
            console.log('[i]: No proxy detected. If login is slow or fails, try setting proxy:');
            console.log('[i]:   export HTTPS_PROXY=http://your-proxy:port');
            console.log('[i]:   or');
            console.log('[i]:   export ALL_PROXY=http://your-proxy:port');
            console.log('[i]:   (Note: Both uppercase and lowercase variable names are supported)');
        }
        // Validate inputs
        if (!username || username.trim() === '') {
            throw new Error('Username cannot be empty');
        }
        if (!password || password.trim() === '') {
            throw new Error('Password cannot be empty');
        }
        // Use base64 encoding to safely pass strings to Python script
        // This avoids all escaping issues with special characters
        const usernameBase64 = Buffer.from(username, 'utf-8').toString('base64');
        const passwordBase64 = Buffer.from(password, 'utf-8').toString('base64');
        const script = `
import json
import sys
import base64
from gppt import GetPixivToken

try:
    # Decode base64-encoded username and password
    username = base64.b64decode('${usernameBase64}').decode('utf-8')
    password = base64.b64decode('${passwordBase64}').decode('utf-8')
    
    if not username or not password:
        print("ERROR: Username or password is empty", file=sys.stderr)
        print(json.dumps({"error": "Username or password is empty"}), file=sys.stdout)
        sys.exit(1)
    
    print(f"[DEBUG]: Starting login for user: {username[:3]}***", file=sys.stderr)
    
    # Check proxy configuration (check both uppercase and lowercase)
    import os
    from urllib.request import getproxies
    
    # Check all possible proxy environment variables
    all_proxy = os.environ.get('ALL_PROXY') or os.environ.get('all_proxy')
    https_proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('https_proxy')
    http_proxy = os.environ.get('HTTP_PROXY') or os.environ.get('http_proxy')
    
    # Also check what getproxies() returns (used by gppt)
    detected_proxies = getproxies()
    
    proxy_env = all_proxy or https_proxy or http_proxy
    
    if proxy_env:
        print(f"[DEBUG]: Environment proxy variables found:", file=sys.stderr)
        if all_proxy:
            print(f"[DEBUG]:   ALL_PROXY/all_proxy: {all_proxy}", file=sys.stderr)
        if https_proxy:
            print(f"[DEBUG]:   HTTPS_PROXY/https_proxy: {https_proxy}", file=sys.stderr)
        if http_proxy:
            print(f"[DEBUG]:   HTTP_PROXY/http_proxy: {http_proxy}", file=sys.stderr)
        print(f"[DEBUG]: getproxies() detected: {detected_proxies}", file=sys.stderr)
        print(f"[DEBUG]: gppt will use: {detected_proxies.get('all') or detected_proxies.get('https') or detected_proxies.get('http') or 'none'}", file=sys.stderr)
    else:
        print("[DEBUG]: No proxy configured in environment variables.", file=sys.stderr)
        print("[DEBUG]: If login fails, set HTTPS_PROXY or ALL_PROXY environment variable.", file=sys.stderr)
    
    print("[DEBUG]: Initializing GetPixivToken (this may take a moment to start Chrome)...", file=sys.stderr)
    g = GetPixivToken(headless=True, username=username, password=password)
    print("[DEBUG]: GetPixivToken initialized, calling login()...", file=sys.stderr)
    print("[DEBUG]: This may take 20-30 seconds. Please wait...", file=sys.stderr)
    
    try:
        res = g.login()
        print("[DEBUG]: login() completed", file=sys.stderr)
    except Exception as login_error:
        # Try to get more diagnostic information if available
        diagnostic_info = {}
        try:
            if hasattr(g, 'driver') and g.driver:
                try:
                    diagnostic_info['current_url'] = g.driver.current_url
                    diagnostic_info['page_title'] = g.driver.title
                except:
                    pass
        except:
            pass
        
        # Re-raise with diagnostic info if available
        if diagnostic_info:
            print(f"[DEBUG]: Diagnostic info: {diagnostic_info}", file=sys.stderr)
        raise login_error
    
    if res is None:
        print("ERROR: gppt.login() returned None", file=sys.stderr)
        print(json.dumps({"error": "gppt.login() returned None"}), file=sys.stdout)
        sys.exit(1)
    
    if not isinstance(res, dict):
        print(f"ERROR: gppt.login() returned unexpected type: {type(res)}", file=sys.stderr)
        print(json.dumps({"error": f"Unexpected return type: {type(res)}"}), file=sys.stdout)
        sys.exit(1)
    
    if 'access_token' not in res:
        print(f"ERROR: gppt.login() response missing access_token", file=sys.stderr)
        print(f"Response keys: {list(res.keys()) if isinstance(res, dict) else 'N/A'}", file=sys.stderr)
        print(json.dumps({"error": "Response missing access_token", "keys": list(res.keys()) if isinstance(res, dict) else None}), file=sys.stdout)
        sys.exit(1)
    
    print("[+]: Success!", file=sys.stderr)
    print(json.dumps(res, indent=2))
except json.JSONDecodeError as e:
    error_msg = f"JSON decode error: {str(e)}"
    print(error_msg, file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    print(json.dumps({"error": error_msg, "type": "JSONDecodeError", "details": str(e)}), file=sys.stdout)
    sys.exit(1)
except Exception as e:
    error_msg = f"ERROR: {str(e)}"
    print(error_msg, file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    
    # Provide additional context for common errors
    error_type = type(e).__name__
    error_str = str(e).lower()
    
    error_details = {
        "error": str(e),
        "type": error_type
    }
    
    # Add suggestions based on error type
    if "timeout" in error_str or "wait_for_redirect" in error_str:
        error_details["suggestion"] = "Login timeout. Possible causes: network issues, Pixiv restrictions, or incorrect credentials. Try using interactive mode or check proxy settings."
    elif "restricted" in error_str or "限制" in error_str:
        error_details["suggestion"] = "Login restricted by Pixiv. Try using interactive mode or wait before retrying."
    
    print(json.dumps(error_details), file=sys.stdout)
    sys.exit(1)
`;
        const result = await runPythonScript(script);
        // Print stderr messages (info/warnings) - but show errors too
        if (result.stderr) {
            const stderrLines = result.stderr.trim().split('\n');
            for (const line of stderrLines) {
                if (line) {
                    if (line.includes('ERROR:')) {
                        console.error(`[!]: ${line}`);
                    }
                    else {
                        console.log(`[i]: ${line}`);
                    }
                }
            }
        }
        if (!result.success) {
            const errorMsg = result.error || result.stderr || 'gppt login failed';
            // Check for specific error types and provide helpful suggestions
            const errorStr = errorMsg.toLowerCase();
            let suggestions = '';
            if (errorStr.includes('timeout') || errorStr.includes('wait_for_redirect')) {
                suggestions = '\n\n[诊断建议]:\n' +
                    '1. 网络连接问题：检查网络连接是否正常，或尝试设置代理\n' +
                    '   export HTTPS_PROXY=http://your-proxy:port\n' +
                    '2. Pixiv 限制：可能被 Pixiv 限制，尝试：\n' +
                    '   - 等待一段时间后重试\n' +
                    '   - 使用交互模式（非无头模式）进行登录\n' +
                    '   - 检查账户是否被限制\n' +
                    '3. 登录凭据：确认用户名和密码是否正确\n' +
                    '4. Chrome/Selenium：确保 Chrome 浏览器和 ChromeDriver 已正确安装';
            }
            else if (errorStr.includes('proxy')) {
                suggestions = '\n\n[诊断建议]:\n' +
                    '1. 检查代理设置是否正确\n' +
                    '2. 如果不需要代理，取消代理设置：unset HTTPS_PROXY ALL_PROXY HTTP_PROXY';
            }
            else if (errorStr.includes('restricted') || errorStr.includes('限制')) {
                suggestions = '\n\n[诊断建议]:\n' +
                    '1. Pixiv 可能检测到自动化登录，建议：\n' +
                    '   - 使用交互模式（会打开浏览器窗口）\n' +
                    '   - 等待一段时间后重试\n' +
                    '   - 检查账户状态';
            }
            throw new Error(errorMsg + suggestions);
        }
        if (!result.stdout || result.stdout.trim() === '') {
            const errorDetails = result.stderr ? `\nPython stderr: ${result.stderr}` : '';
            throw new Error(`No response from gppt login${errorDetails}`);
        }
        try {
            const response = JSON.parse(result.stdout);
            // Check if the response is an error object
            if (response && typeof response === 'object' && 'error' in response) {
                const errorDetails = result.stderr ? `\nPython stderr: ${result.stderr}` : '';
                const errorMsg = response.error;
                // Use suggestion from Python script if available, otherwise generate one
                let suggestions = '';
                if (response.suggestion) {
                    suggestions = `\n\n[建议]: ${response.suggestion}`;
                }
                else {
                    // Provide suggestions based on error type
                    const errorStr = errorMsg.toLowerCase();
                    if (errorStr.includes('timeout') || errorStr.includes('wait_for_redirect')) {
                        suggestions = '\n\n[诊断建议]:\n' +
                            '1. 网络连接问题：检查网络连接，或设置代理\n' +
                            '2. Pixiv 限制：尝试使用交互模式登录\n' +
                            '3. 登录凭据：确认用户名和密码是否正确';
                    }
                }
                throw new Error(`gppt login error: ${errorMsg}${suggestions}${errorDetails}`);
            }
            return convertGpptResponseToLoginInfo(response);
        }
        catch (parseError) {
            const errorDetails = result.stderr ? `\nPython stderr: ${result.stderr}` : '';
            throw new Error(`Failed to parse gppt response: ${parseError}\nstdout: ${result.stdout.substring(0, 200)}${errorDetails}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[!]: Python gppt login failed:', errorMessage);
        // Provide fallback suggestion
        console.log('\n[i]: 提示：如果无头模式失败，可以尝试交互模式：');
        console.log('[i]:   不使用 --headless 参数，或使用 --interactive 参数');
        console.log('[i]:   交互模式会打开浏览器窗口，需要手动登录');
        return null;
    }
}
/**
 * Convert gppt response to LoginInfo format
 */
function convertGpptResponseToLoginInfo(response) {
    return {
        access_token: response.access_token,
        expires_in: response.expires_in,
        token_type: response.token_type || 'bearer',
        scope: response.scope || '',
        refresh_token: response.refresh_token,
        user: response.user,
        response: response,
    };
}
/**
 * Run a Python script and return the result
 */
async function runPythonScript(script, timeoutMs = 120000) {
    return new Promise((resolve) => {
        // Add import sys at the beginning if not present
        const fullScript = script.includes('import sys') ? script : `import sys\n${script}`;
        const python = (0, child_process_1.spawn)('python3', ['-c', fullScript], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        let resolved = false;
        // Set timeout
        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                python.kill('SIGTERM');
                resolve({
                    success: false,
                    stdout: stdout.trim(),
                    stderr: stderr.trim() || undefined,
                    error: `Python script timed out after ${timeoutMs / 1000} seconds. This may indicate:\n` +
                        `  1. Network connectivity issues (try setting HTTPS_PROXY)\n` +
                        `  2. Chrome/ChromeDriver not properly installed\n` +
                        `  3. Pixiv login page is slow to respond\n` +
                        `\nCheck the stderr output above for more details.`,
                });
            }
        }, timeoutMs);
        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        python.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        python.on('close', (code) => {
            if (resolved)
                return;
            resolved = true;
            clearTimeout(timeout);
            if (code === 0) {
                resolve({
                    success: true,
                    stdout: stdout.trim(),
                    stderr: stderr.trim() || undefined,
                });
            }
            else {
                resolve({
                    success: false,
                    stdout: stdout.trim(),
                    stderr: stderr.trim() || undefined,
                    error: stderr.trim() || `Process exited with code ${code}`,
                });
            }
        });
        python.on('error', (error) => {
            if (resolved)
                return;
            resolved = true;
            clearTimeout(timeout);
            resolve({
                success: false,
                stdout: '',
                stderr: '',
                error: error.message,
            });
        });
    });
}
/**
 * Run a command and return the result
 */
async function runCommand(command, args) {
    return new Promise((resolve) => {
        const process = (0, child_process_1.spawn)(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    stdout: stdout.trim(),
                });
            }
            else {
                resolve({
                    success: false,
                    error: stderr.trim() || `Process exited with code ${code}`,
                });
            }
        });
        process.on('error', (error) => {
            resolve({
                success: false,
                error: error.message,
            });
        });
    });
}
//# sourceMappingURL=python-login-adapter.js.map