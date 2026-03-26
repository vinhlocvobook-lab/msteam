import * as msal from '@azure/msal-node';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const TOKEN_CACHE_FILE = path.join(process.cwd(), '.token-cache.json');

const cachePlugin: msal.ICachePlugin = {
    beforeCacheAccess: async (ctx) => {
        if (fs.existsSync(TOKEN_CACHE_FILE)) {
            ctx.tokenCache.deserialize(
                fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8')
            );
        }
    },
    afterCacheAccess: async (ctx) => {
        if (ctx.cacheHasChanged) {
            fs.writeFileSync(TOKEN_CACHE_FILE, ctx.tokenCache.serialize());
        }
    }
};

const msalApp = new msal.PublicClientApplication({
    auth: {
        clientId: config.azure.clientId,
        authority: `https://login.microsoftonline.com/${config.azure.tenantId}`
    },
    cache: { cachePlugin }
});

export async function getAccessToken(): Promise<string> {
    // Thử lấy token từ cache trước (tự động refresh nếu hết hạn)
    const accounts = await msalApp.getTokenCache().getAllAccounts();
    if (accounts.length > 0) {
        try {
            const result = await msalApp.acquireTokenSilent({
                account: accounts[0],
                scopes: config.azure.scopes
            });
            console.log(`✅ Token OK (${accounts[0].username})`);
            return result!.accessToken;
        } catch {
            console.log('⚠️  Token expired, re-authenticating...');
        }
    }

    // Device Code Flow — chỉ cần làm 1 lần đầu
    const result = await msalApp.acquireTokenByDeviceCode({
        scopes: config.azure.scopes,
        deviceCodeCallback: (response) => {
            console.log('\n🔐 Đăng nhập Microsoft Teams:');
            console.log(`👉 Truy cập : ${response.verificationUri}`);
            console.log(`📋 Nhập code: ${response.userCode}\n`);
        }
    });

    console.log(`✅ Đăng nhập thành công: ${result?.account?.username}`);
    return result!.accessToken;
}