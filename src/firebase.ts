/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyADXt7Ku0RH748rmB2Qr9BVzuilAx6dAoc",
  authDomain: "pdf-app-8b9e4.firebaseapp.com",
  projectId: "pdf-app-8b9e4",
  storageBucket: "pdf-app-8b9e4.firebasestorage.app",
  messagingSenderId: "431600700899",
  appId: "1:431600700899:web:5c3af64f82d970ff3fe4d6",
  measurementId: "G-8NDLS2Q7FN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Gracefully export analytics if supported in current client context
export const analyticsPromise = isSupported().then((supported) => {
  return supported ? getAnalytics(app) : null;
});

