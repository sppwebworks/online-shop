import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Clear any corrupted localStorage data
try {
  const theme = localStorage.getItem("theme");
  if (theme) {
    JSON.parse(theme);
  }
} catch (e) {
  localStorage.removeItem("theme");
  console.log("Cleared corrupted theme data");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
