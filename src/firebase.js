import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDvMDz8v5bruA0czhUD1UUpurjTpS9Pao0",
  authDomain: "ffws-draft.firebaseapp.com",
  databaseURL: "https://ffws-draft-default-rtdb.firebaseio.com/",
  projectId: "ffws-draft",
  storageBucket: "ffws-draft.firebasestorage.app",
  messagingSenderId: "951545511666",
  appId: "1:951545511666:web:cd24c81219dceab989da6b"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, onValue };
