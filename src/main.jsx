
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import { Toaster } from 'react-hot-toast';
import "./styles/fonts.css";
import "./firebase/config.js"; // Add the .js extension
import "../public/css/tailwind.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster position="top-center" />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
