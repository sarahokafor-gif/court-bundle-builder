// Firebase configuration for Court Bundle Builder
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase configuration
// These values are safe to expose in client-side code
// Security is handled by Firebase Security Rules
const firebaseConfig = {
  apiKey: "AIzaSyCyImZnSeMTv4LUuHMW4eTsl5CK80SjoEA",
  authDomain: "court-bundle-builder.firebaseapp.com",
  projectId: "court-bundle-builder",
  storageBucket: "court-bundle-builder.firebasestorage.app",
  messagingSenderId: "726821679089",
  appId: "1:726821679089:web:19efdaf18b05eb3f1e1e50",
  measurementId: "G-M64BBWRBYC"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication
export const auth = getAuth(app)

export default app
