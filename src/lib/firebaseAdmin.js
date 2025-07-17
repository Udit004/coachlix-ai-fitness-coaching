// lib/firebaseAdmin.js
import admin from 'firebase-admin';

// Parse service account from environment variables
let serviceAccount;

try {
  // Check for individual environment variables first (recommended)
  if (process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    };
  } else if (process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64) {
    // Method 2: Base64 encoded JSON
    const base64Credentials = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    const jsonString = Buffer.from(base64Credentials, 'base64').toString('utf8');
    serviceAccount = JSON.parse(jsonString);
  } else if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    // Method 3: Direct JSON string
    serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
  } else {
    throw new Error('No Firebase Admin credentials found. Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_PRIVATE_KEY, and FIREBASE_ADMIN_CLIENT_EMAIL environment variables.');
  }

  // Ensure private_key has proper line breaks
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

} catch (error) {
  console.error('Failed to parse Firebase Admin credentials:', error);
  throw new Error('Invalid Firebase Admin credentials: ' + error.message);
}

// Validate required fields
const requiredFields = ['project_id', 'private_key', 'client_email'];
for (const field of requiredFields) {
  if (!serviceAccount[field]) {
    console.error(`Missing field: ${field}`);
    console.error('Available fields:', Object.keys(serviceAccount));
    throw new Error(`Service account is missing required field: ${field}`);
  }
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw new Error('Failed to initialize Firebase Admin: ' + error.message);
  }
}

export default admin;