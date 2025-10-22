// server/utils/google-oauth.js

const { google } = require("googleapis");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = [
  "openid",
  "email",
  "profile",
  // cần gì thêm thì bỏ comment dưới:
  // "https://www.googleapis.com/auth/indexing",
  // "https://www.googleapis.com/auth/webmasters",
];

function getClient() {
  // google.auth.OAuth2 có dạng constructor(OAUTH_CLIENT_ID, SECRET, REDIRECT_URL)
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

function buildGoogleAuthUrl({ state }) {
  const client = getClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
  return url;
}

async function exchangeCodeForTokens(code) {
  const client = getClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

async function fetchGoogleProfile(tokens) {
  const client = getClient();
  client.setCredentials(tokens);

  // Gọi API userinfo v2 qua googleapis
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get(); // { id, email, name, picture, ... }
  return data;
}

module.exports = {
  getClient,
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleProfile,
};
