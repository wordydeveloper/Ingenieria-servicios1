// assets/js/helpers/AuthManager.js

const AuthManager = {
  saveToken: (token, type = "Bearer") => {
    localStorage.setItem("token", token);
    localStorage.setItem("token_type", type);
  },
  getToken: () => {
    return localStorage.getItem("token");
  },
  getTokenType: () => {
    return localStorage.getItem("token_type") || "Bearer";
  },
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
  }
};
