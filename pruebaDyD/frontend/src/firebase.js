import { initializeApp } from "firebase/app"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"

// Configuración de Firebase (válida para dev y prod)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)

// Inicializar servicios
const db = getFirestore(app)
const storage = getStorage(app)

//  CONECTAR A EMULATORS SOLO EN DESARROLLO
if (import.meta.env.DEV) {
  console.log(" Firebase Emulator MODE")

  connectFirestoreEmulator(db, "localhost", 8080)
  connectStorageEmulator(storage, "localhost", 9199)
} else {
  console.log(" Firebase Production MODE")
}

// Exportar servicios
export { app, db, storage }
