import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { firebaseConfig } from "./keys";

// ensure that the app is initialized only once
let app;
if (getApps().length === 0) { app = initializeApp(firebaseConfig); } 
else { app = getApp(); }

// Initialize firebase platforms
let realtime = getDatabase(app); // For Realtime Database
let storage = getStorage(app); // For Cloud Storage
let firestore = getFirestore(app); // For Cloud Firestore

// ensure that the auth is initialized only once
let auth;
try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); } 
catch (error) { auth = getAuth(app); }

//export firebase platforms
export { auth, realtime, storage, firestore };

/* note: 
windows 11 problem, const app is initializing more that once.
error also state auth is already been initialized, this ensure everything is initialized only once.
idea not mine, followed https://github.com/firebase/firebase-js-sdk/discussions/4510
 */
