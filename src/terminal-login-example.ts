/**
 * Terminal Login Usage Examples
 * 
 * This file demonstrates how to use the terminal login module in your code.
 * Uses the gppt package (pip install gppt) for authentication.
 * 
 * Reference: https://github.com/eggplants/get-pixivpy-token
 */

import { TerminalLogin, PixivTerminalAuth, LoginInfo } from './terminal-login';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Example 1: Basic login with gppt (interactive mode)
 * gppt will open a browser window for manual login
 */
async function exampleBasicLogin(): Promise<void> {
  console.log('Example 1: Basic Login with gppt (Interactive Mode)\n');
  
  const login = new TerminalLogin({ headless: false });
  
  try {
    const result = await login.login();
    console.log('✓ Login successful!');
    console.log('Access Token:', result.access_token);
    console.log('Refresh Token:', result.refresh_token);
    console.log('Expires In:', result.expires_in, 'seconds');
  } catch (error) {
    console.error('✗ Login failed:', error);
  }
}

/**
 * Example 2: Headless login with credentials
 * Automatic login using gppt in headless mode (no visible browser window)
 */
async function exampleHeadlessLogin(): Promise<void> {
  console.log('Example 2: Headless Login with Credentials (gppt)\n');
  
  const login = new TerminalLogin({
    headless: true,
    username: 'your_email@example.com',
    password: 'your_password',
  });
  
  try {
    const result = await login.login();
    console.log('✓ Headless login successful!');
    console.log('Refresh Token:', result.refresh_token);
  } catch (error) {
    console.error('✗ Headless login failed:', error);
  }
}

/**
 * Example 3: Token-based authentication with caching
 * Save and reuse refresh token (similar to README example)
 */
async function exampleTokenCaching(): Promise<void> {
  console.log('Example 3: Token Caching\n');
  
  const tokenFile = path.join(__dirname, '../../config/token.txt');
  
  async function getRefreshToken(): Promise<string> {
    try {
      // Try to read cached token
      const cachedToken = await fs.readFile(tokenFile, 'utf-8');
      if (cachedToken.trim()) {
        console.log('✓ Using cached refresh token');
        return cachedToken.trim();
      }
    } catch (error) {
      // File doesn't exist, need to login
    }
    
    // No cached token, perform login
    console.log('No cached token found, logging in...');
    const login = new TerminalLogin({ headless: true });
    const result = await login.login({
      username: 'your_email@example.com',
      password: 'your_password',
    });
    
    // Save token for future use
    await fs.writeFile(tokenFile, result.refresh_token, 'utf-8');
    console.log('✓ Refresh token saved to', tokenFile);
    
    return result.refresh_token;
  }
  
  try {
    const refreshToken = await getRefreshToken();
    
    // Use the refresh token to get a fresh access token
    const loginInfo = await TerminalLogin.refresh(refreshToken);
    console.log('✓ Authentication successful!');
    console.log('Access Token:', loginInfo.access_token);
    console.log('Valid for:', loginInfo.expires_in, 'seconds');
  } catch (error) {
    console.error('✗ Token caching example failed:', error);
  }
}

/**
 * Example 4: Interactive authentication with retry
 * Using PixivTerminalAuth for robust authentication
 */
async function exampleInteractiveAuth(): Promise<void> {
  console.log('Example 4: Interactive Authentication with Retry\n');
  
  const auth = new PixivTerminalAuth('config/client.json');
  
  try {
    const loginInfo = await auth.auth();
    console.log('✓ Authentication successful!');
    console.log('User:', loginInfo.user.name);
    console.log('Account:', loginInfo.user.account);
    console.log('Premium:', loginInfo.user.is_premium ? 'Yes' : 'No');
  } catch (error) {
    console.error('✗ Interactive auth failed:', error);
  }
}

/**
 * Example 5: Refresh existing token
 * Use this when you already have a refresh token
 */
async function exampleRefreshToken(): Promise<void> {
  console.log('Example 5: Refresh Existing Token\n');
  
  const existingRefreshToken = 'your_refresh_token_here';
  
  try {
    const loginInfo = await TerminalLogin.refresh(existingRefreshToken);
    console.log('✓ Token refreshed successfully!');
    console.log('New Access Token:', loginInfo.access_token);
    console.log('Expires In:', loginInfo.expires_in, 'seconds');
  } catch (error) {
    console.error('✗ Token refresh failed:', error);
  }
}

/**
 * Example 6: Integration with PixivFlow
 * Complete workflow for the downloader
 */
async function exampleDownloaderIntegration(): Promise<void> {
  console.log('Example 6: Downloader Integration\n');
  
  const configPath = path.join(__dirname, '../../config/standalone.config.json');
  
  try {
    // Step 1: Get refresh token
    const tokenFile = path.join(__dirname, '../../config/token.txt');
    let refreshToken: string;
    
    try {
      refreshToken = (await fs.readFile(tokenFile, 'utf-8')).trim();
    } catch {
      // First time login
      const login = new TerminalLogin({ headless: false });
      const result = await login.login();
      refreshToken = result.refresh_token;
      await fs.writeFile(tokenFile, refreshToken, 'utf-8');
    }
    
    // Step 2: Refresh to get current access token
    const loginInfo = await TerminalLogin.refresh(refreshToken);
    
    // Step 3: Update config file
    const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    configData.pixiv.refreshToken = loginInfo.refresh_token;
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    
    console.log('✓ Configuration updated successfully!');
    console.log('You can now run the downloader with:');
    console.log('  npm run download');
  } catch (error) {
    console.error('✗ Integration example failed:', error);
  }
}

/**
 * Example 7: Save credentials for future use
 * Create client.json file with credentials
 */
async function exampleSaveCredentials(): Promise<void> {
  console.log('Example 7: Save Credentials\n');
  
  const credentials = {
    pixiv_id: 'your_email@example.com',
    password: 'your_password',
  };
  
  const clientJsonPath = path.join(__dirname, '../../config/client.json');
  
  try {
    await fs.writeFile(
      clientJsonPath,
      JSON.stringify(credentials, null, 2),
      'utf-8'
    );
    console.log('✓ Credentials saved to', clientJsonPath);
    console.log('Next time you can use PixivTerminalAuth to auto-login');
  } catch (error) {
    console.error('✗ Failed to save credentials:', error);
  }
}

/**
 * Main function - run all examples
 */
async function runExamples(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║     Pixiv Terminal Login - Usage Examples                      ║');
  console.log('║     Using gppt package (pip install gppt)                      ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  console.log('Choose an example to run:\n');
  console.log('1. Basic Login with gppt (Interactive Mode)');
  console.log('2. Headless Login with Credentials');
  console.log('3. Token Caching');
  console.log('4. Interactive Authentication with Retry');
  console.log('5. Refresh Existing Token');
  console.log('6. Downloader Integration (Recommended)');
  console.log('7. Save Credentials');
  console.log('\nNote: Edit the credentials in this file before running.\n');
  
  // You can uncomment and run specific examples:
  // await exampleBasicLogin();
  // await exampleHeadlessLogin();
  // await exampleTokenCaching();
  // await exampleInteractiveAuth();
  // await exampleRefreshToken();
  // await exampleDownloaderIntegration();
  // await exampleSaveCredentials();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch((error) => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}

export {
  exampleBasicLogin,
  exampleHeadlessLogin,
  exampleTokenCaching,
  exampleInteractiveAuth,
  exampleRefreshToken,
  exampleDownloaderIntegration,
  exampleSaveCredentials,
};

