import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { revealKey } from './security';

// Hardcoded Firebase configuration
const firebaseConfig = {
  apiKey: revealKey("eE1zWS1PMHBaVXI1OGpwZHNlMTFwN01WbzBveHpsTm1RbEZubVZO"),
  authDomain: "matts-husky-game.firebaseapp.com",
  projectId: "matts-husky-game",
  storageBucket: "matts-husky-game.appspot.com",
  messagingSenderId: "782699210186",
  appId: "1:782699210186:web:07777484ea30ef891c1b33",
  measurementId: "G-0243VWTQS0"
};

// =================================================================================
// Firebase Initialization
// =================================================================================
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e: any) {
    console.error("Fatal Error: Failed to initialize Firebase with the hardcoded configuration.", e);
    // In a real app, you might want to show a full-page error here.
}

export { app, auth, db };


// --- Path Helper Functions ---
const APP_DATA_PREFIX = 'husky-snow-rpg-data';
export const getGameCollectionPath = () => `/artifacts/${APP_DATA_PREFIX}/public/data/games`;
export const getGameDocPath = (gameId: string) => `${getGameCollectionPath()}/${gameId}`;
export const getMessagesColPath = (gameId: string) => `${getGameDocPath(gameId)}/messages`;