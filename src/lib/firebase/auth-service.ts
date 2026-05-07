import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { auth } from "./config";

export const authService = {
  /**
   * Listen for auth state changes
   */
  onAuthStateChange: (callback: (user: User | null) => void) => {
    if (!auth || !auth.app) {
      // If mock, trigger guest state immediately to prevent hanging UI
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  /**
   * Log out the current user
   */
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },

  /**
   * Get current user token (for middleware/server-side validation)
   */
  getIdToken: async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }
};
