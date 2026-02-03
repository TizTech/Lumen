const path = require("node:path");
const { notarize } = require("@electron/notarize");

// Notarization runs after signing. Requires either:
// 1) APPLE_ID + APPLE_ID_PASS (app-specific password), or
// 2) APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER (App Store Connect API key)
module.exports = async function notarizeApp(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appBundleId = packager.appInfo.id;
  const appPath = path.join(appOutDir, `${appName}.app`);

  const {
    APPLE_ID,
    APPLE_ID_PASS,
    APPLE_API_KEY,
    APPLE_API_KEY_ID,
    APPLE_API_ISSUER,
  } = process.env;

  if (APPLE_API_KEY && APPLE_API_KEY_ID && APPLE_API_ISSUER) {
    await notarize({
      appBundleId,
      appPath,
      appleApiKey: APPLE_API_KEY,
      appleApiKeyId: APPLE_API_KEY_ID,
      appleApiIssuer: APPLE_API_ISSUER,
    });
    return;
  }

  if (APPLE_ID && APPLE_ID_PASS) {
    await notarize({
      appBundleId,
      appPath,
      appleId: APPLE_ID,
      appleIdPassword: APPLE_ID_PASS,
    });
    return;
  }

  throw new Error(
    "Notarization credentials missing. Set APPLE_ID + APPLE_ID_PASS or APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER."
  );
};
