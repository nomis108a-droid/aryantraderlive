// This file is deprecated in favor of the standardized scaffolding in src/firebase/
// Redirecting to the central config to avoid conflicts.
import { initializeFirebase } from '@/firebase';

const { firebaseApp, firestore: db, auth } = typeof window !== 'undefined' ? initializeFirebase() : { firebaseApp: null, firestore: null, auth: null };

export { auth, db };
