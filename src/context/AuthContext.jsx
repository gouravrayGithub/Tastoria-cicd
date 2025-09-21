import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { auth } from '../firebase/config';
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Helper: try exchanging Firebase idToken with backend to get app token/user
 const exchangeFirebaseToken = async (fbUser) => {
  try {
    const res = await axios.post(`${API_URL}/api/auth/google-signin`, {
      name: fbUser.displayName,
      email: fbUser.email,
      firebaseUid: fbUser.uid,
    });

    if (res?.data?.token && res?.data?.user) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { ok: true, user: res.data.user, token: res.data.token };
    }
  } catch (err) {
    console.error("Token exchange failed:", err);
  }
  return { ok: false };
};


  // Listen for Firebase auth changes and reconcile with backend / local user
  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (fbUser) => {
    setLoading(true);
    if (fbUser) {
      setFirebaseUser(fbUser);
      try {
        // exchange fbUser with backend
        const exchanged = await exchangeFirebaseToken(fbUser);
        if (!exchanged.ok) {
          // fallback: expose firebase user with idToken as token
          const idToken = await fbUser.getIdToken();
          const fallbackUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            provider: 'firebase'
          };
          localStorage.setItem('token', idToken);
          localStorage.setItem('user', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
        }
      } catch (err) {
        console.error("Firebase auth handling error:", err);
        toast.error("Firebase sign-in encountered an issue.");
      } finally {
        setLoading(false);
      }
    } else {
      setFirebaseUser(null);
      setLoading(false);
    }
  });
  return () => unsub();
}, []);


  const signup = async (name, email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        name,
        email,
        password,
        confirmPassword: password
      });

      if (response.status === 201) {
        toast.success('Registration successful! Please verify your email.');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Signup failed');
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.message || error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });

      if (response.data.token) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        toast.success('Login successful!');
        return { success: true, user: userData };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // clear app local state + backend token
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      // also sign out from firebase if signed in
      if (auth) {
        try {
          await firebaseSignOut(auth);
        } catch (e) {
          // ignore firebase sign out errors
        }
      }
      navigate('/sign-in');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const loginWithUser = (userObj, token) => {
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    if (token) localStorage.setItem('token', token);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    error,
    signup,
    login,
    loginWithUser,
    logout,
    isAuthenticated: !!user || !!firebaseUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
