// Firebase auth has been removed for local development mode.
// This file is kept as a placeholder if auth needs to be re-integrated later.

export const auth = {};
export const signInWithGoogle = async () => {};
export const logout = () => {};
export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};