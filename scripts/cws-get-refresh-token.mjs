#!/usr/bin/env node
// Generate a Chrome Web Store API refresh token via the loopback OAuth flow.
//
// Prereqresuites (one time, in Google Cloud for the account that owns the extension):
//   1. Create / pick a project; enable the "Chrome Web Store API".
//   2. Configure the OAuth consent screen (User type: External; add your own
//      Google account under "Test users").
//   3. Create an OAuth client ID of type "Desktop app". Note its client id + secret.
//
// Usage:
//   node scripts/cws-get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
//   (or set CWS_CLIENT_ID / CWS_CLIENT_SECRET in the environment)
//
// It starts a local server, opens a Google consent URL, and after you approve it
// prints the refresh token. Nothing is sent anywhere except Google's own OAuth
// endpoints. The token is printed only to your terminal — store it as the
// CWS_REFRESH_TOKEN GitHub secret.

import http from 'node:http';
import { spawn } from 'node:child_process';

const clientId = process.argv[2] || process.env.CWS_CLIENT_ID;
const clientSecret = process.argv[3] || process.env.CWS_CLIENT_SECRET;
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

if (!clientId || !clientSecret) {
  console.error('Usage: node scripts/cws-get-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/') { res.writeHead(404).end(); return; }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/plain' }).end(`Authorization failed: ${error}`);
    console.error('Authorization failed:', error);
    server.close();
    process.exit(1);
  }
  if (!code) { res.writeHead(400).end('No code'); return; }

  const redirectUri = `http://localhost:${server.address().port}`;
  const body = new URLSearchParams({
    code, client_id: clientId, client_secret: clientSecret,
    redirect_uri: redirectUri, grant_type: 'authorization_code'
  });

  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
    });
    const data = await resp.json();
    if (!data.refresh_token) {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
        .end('No refresh token returned. Revoke prior access and retry with prompt=consent.');
      console.error('Response had no refresh_token:', JSON.stringify(data, null, 2));
      server.close();
      process.exit(1);
    }
    res.writeHead(200, { 'Content-Type': 'text/plain' })
      .end('Success. Refresh token printed in your terminal — you can close this tab.');
    console.log('\n=== Your Chrome Web Store refresh token ===\n');
    console.log(data.refresh_token);
    console.log('\nSet it as the GitHub secret CWS_REFRESH_TOKEN. Do not paste it in chat.\n');
  } catch (e) {
    res.writeHead(500).end('Token exchange failed');
    console.error(e);
  } finally {
    server.close();
  }
});

server.listen(0, () => {
  const redirectUri = `http://localhost:${server.address().port}`;
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: 'code',
    scope: SCOPE, access_type: 'offline', prompt: 'consent'
  });
  console.log('\nOpen this URL in your browser and approve access:\n');
  console.log(authUrl + '\n');
  // Best-effort auto-open (macOS/Linux/WSL); harmless if it fails.
  const opener = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', authUrl] : [authUrl];
  try { spawn(opener, args, { stdio: 'ignore', detached: true }).unref(); } catch { /* ignore */ }
});
