// Use Replit auth only when REPLIT_AUTH=true, otherwise use local auth
const useReplitAuth = process.env.REPLIT_AUTH === "true";

// Dynamic import based on environment
const authModule = useReplitAuth
  ? await import("./replitAuth.js")
  : await import("./localAuth.js");

export const { setupAuth, isAuthenticated, getSession } = authModule;

export { authStorage, type IAuthStorage } from "./storage.js";
export { registerAuthRoutes } from "./routes.js";
