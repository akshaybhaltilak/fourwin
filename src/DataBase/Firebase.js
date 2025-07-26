import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, set, onValue, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBFMzJxbSS2o10wZqg4GBlFKJ89_6vI27c",
  authDomain: "fourwincar-6bcb1.firebaseapp.com",
  projectId: "fourwincar-6bcb1",
  storageBucket: "fourwincar-6bcb1.appspot.com",
  messagingSenderId: "117906845641",
  appId: "1:117906845641:web:9d96b62b4afaadca870218",
  databaseURL: "https://fourwincar-6bcb1-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, set, onValue, update, remove };