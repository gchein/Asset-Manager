import jwt from "jsonwebtoken";

function formatPrivateKey(key: string): string {
  // Handle literal \n sequences
  let formatted = key.replace(/\\n/g, "\n");

  // If the key is all on one line with spaces separating the base64 chunks,
  // reconstruct proper PEM format
  if (!formatted.includes("\n")) {
    const header = "-----BEGIN RSA PRIVATE KEY-----";
    const footer = "-----END RSA PRIVATE KEY-----";
    let body = formatted
      .replace(header, "")
      .replace(footer, "")
      .trim()
      .replace(/\s+/g, "");
    // Split into 64-char lines per PEM spec
    const lines = body.match(/.{1,64}/g) || [];
    formatted = [header, ...lines, footer].join("\n");
  }

  return formatted;
}

// In-memory token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const privateKey = process.env.DOCUSIGN_PRIVATE_KEY;

  if (!integrationKey || !userId || !privateKey) {
    throw new Error("Missing DocuSign environment variables");
  }

  const now = Math.floor(Date.now() / 1000);
  const jwtToken = jwt.sign(
    {
      iss: integrationKey,
      sub: userId,
      aud: "account-d.docusign.com",
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    },
    formatPrivateKey(privateKey),
    { algorithm: "RS256" }
  );

  const tokenResponse = await fetch("https://account-d.docusign.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`DocuSign token request failed (${tokenResponse.status}): ${text}`);
  }

  const { access_token } = await tokenResponse.json() as { access_token: string };

  cachedAccessToken = access_token;
  tokenExpiresAt = Date.now() + 3600 * 1000;

  return access_token;
}

interface SendContractResult {
  envelope_id: string;
  status: string;
  name: string;
  email: string;
}

export async function sendContract(name: string, email: string): Promise<SendContractResult> {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  const apiKey = process.env.MAKE_API_KEY;

  if (!webhookUrl || !apiKey) {
    throw new Error("Missing MAKE_WEBHOOK_URL or MAKE_API_KEY environment variables");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-make-apikey": apiKey,
    },
    body: JSON.stringify({ name, email }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Make.com webhook failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<SendContractResult>;
}

export async function getEnvelopeStatus(envelopeId: string): Promise<string> {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  if (!accountId) throw new Error("Missing DOCUSIGN_ACCOUNT_ID");

  const accessToken = await getAccessToken();

  const envelopeResponse = await fetch(
    `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!envelopeResponse.ok) {
    const text = await envelopeResponse.text();
    throw new Error(`DocuSign envelope query failed (${envelopeResponse.status}): ${text}`);
  }

  const envelope = await envelopeResponse.json() as { status: string };
  return envelope.status;
}

export async function downloadDocument(envelopeId: string): Promise<ArrayBuffer> {
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  if (!accountId) throw new Error("Missing DOCUSIGN_ACCOUNT_ID");

  const accessToken = await getAccessToken();

  const response = await fetch(
    `https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
    {
      headers: {
        Accept: "application/pdf",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DocuSign document download failed (${response.status}): ${text}`);
  }

  return response.arrayBuffer();
}
