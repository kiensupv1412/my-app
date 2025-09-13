const fs = require("fs");
const { google } = require("googleapis");
const os = require("os");
const path = require("path");

/**
 * Retrieves an access token for Google APIs using service account credentials.
 * @param client_email - The client email of the service account.
 * @param private_key - The private key of the service account.
 * @param customPath - (Optional) Custom path to the service account JSON file.
 * @returns The access token.
 */
async function getAccessToken(client_email, private_key, customPath) {
  if (!client_email && !private_key) {
    const filePath = "service_account.json";
    const filePathFromHome = path.join(__dirname, "../service_account.json");
    const isFile = fs.existsSync(filePath);
    const isFileFromHome = fs.existsSync(filePathFromHome);
    const isCustomFile = !!customPath && fs.existsSync(customPath);

    if (!isFile && !isFileFromHome && !isCustomFile) {
      console.error(`❌ ${filePath} not found, please follow the instructions in README.md`);
      console.error("");
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`GSC error ${response.status}: ${msg}`);
    }

    const key = JSON.parse(
      fs.readFileSync(!!customPath && isCustomFile ? customPath : isFile ? filePath : filePathFromHome, "utf8"),
    );
    client_email = key.client_email;
    private_key = key.private_key;
  } else {
    if (!client_email) {
      console.error("❌ Missing client_email in service account credentials.");
      console.error("");
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`GSC error ${response.status}: ${msg}`);
    }

    if (!private_key) {
      console.error("❌ Missing private_key in service account credentials.");
      console.error("");
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`GSC error ${response.status}: ${msg}`);
    }
  }

  const jwtClient = new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/indexing"],
  });

  const tokens = await jwtClient.authorize();
  return tokens.access_token;
}

module.exports = { getAccessToken };
