import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile,
    User,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

export const signUp = async (email: string, password: string, name: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
};

export const signIn = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
    return onAuthStateChanged(auth, callback);
};