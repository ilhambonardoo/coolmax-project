import admin from "firebase-admin";
import { ResponseError } from "@/lib/errors/response-error";

let serviceAccount;
const dbUrl = process.env.FIREBASE_DB_URL;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(
      Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "./serviceAccount.json",
        "base64"
      ).toString("utf-8")
    );
  } catch (error) {
    throw new ResponseError(
      500,
      `Failed to parse Firebase service account: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
} else {
  throw new ResponseError(
    500,
    "FIREBASE_SERVICE_ACCOUNT environment variable is not defined"
  );
}

try {
  const appOptions: admin.AppOptions = dbUrl
    ? {
        credential: admin.credential.cert(serviceAccount),
        databaseURL: dbUrl,
      }
    : {
        credential: admin.credential.cert(serviceAccount),
      };

  admin.initializeApp(appOptions);
} catch (error) {
  throw new ResponseError(
    500,
    `Failed to initialize Firebase Admin: ${
      error instanceof Error ? error.message : "Unknown error"
    }`
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: dbUrl,
  });
}

export const db = admin.database();
