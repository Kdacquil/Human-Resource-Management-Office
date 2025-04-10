import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

export const firebaseConfig = environment.firebase;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
