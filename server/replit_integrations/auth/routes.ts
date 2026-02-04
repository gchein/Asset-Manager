import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage.js";

// Import isAuthenticated based on environment to avoid circular dependency
const useReplitAuth = process.env.REPLIT_AUTH === "true";
const authModule = useReplitAuth
  ? await import("./replitAuth.js")
  : await import("./localAuth.js");
const isAuthenticated: RequestHandler = authModule.isAuthenticated;

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/user/update-name", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      const user = await authStorage.updateUserName(userId, firstName, lastName);
      res.json(user);
    } catch (error) {
      console.error("Error updating user name:", error);
      res.status(500).json({ message: "Failed to update user name" });
    }
  });
}
