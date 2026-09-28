import config from '../firebase-applet-config.json' with { type: 'json' };

// Firebase verifies the token remotely; no service-account key is exposed or needed.
export async function verifyAccount(authorization: string | undefined): Promise<string | null> {
  const token = authorization?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token || token.length > 8000) return null;
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    if (claims.aud !== config.projectId || claims.iss !== `https://securetoken.google.com/${config.projectId}`) return null;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const result = await response.json();
    const account = result.users?.[0];
    return account && !account.disabled && account.localId === claims.sub ? account.localId : null;
  } catch { return null; }
}
