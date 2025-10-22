// server/utils/storage.js
const Users = require("../models/users.model");
const UserTokens = require("../models/user_tokens.model");

async function upsertUserByGoogle(profile) {
  const [user] = await Users.upsert(profile);
  return user;
}

async function storeUserToken(userId, tokens) {
  await UserTokens.upsert({
    user_id: userId,
    ...tokens,
    provider: "google",
  });
}

async function getUserToken(userId) {
  return await UserTokens.findOne({ where: { user_id: userId } });
}

async function revokeGoogleToken(tokens) {
  // optional: gọi Google revoke endpoint
}

module.exports = {
  upsertUserByGoogle,
  storeUserToken,
  getUserToken,
  revokeGoogleToken,
};
