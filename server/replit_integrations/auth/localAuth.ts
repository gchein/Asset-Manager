import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";

// Local auth for development - bypasses Replit OIDC

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP for local dev
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Local login page
  app.get("/api/login", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Local Dev Login</title>
          <style>
            body { font-family: system-ui; max-width: 400px; margin: 100px auto; padding: 20px; }
            input, button { width: 100%; padding: 10px; margin: 5px 0; box-sizing: border-box; }
            button { background: #0066cc; color: white; border: none; cursor: pointer; }
            button:hover { background: #0055aa; }
            .info { background: #f0f0f0; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h2>Local Development Login</h2>
          <div class="info">
            This is a mock login for local development.<br>
            Enter any user ID (e.g., "dev-user-1") to simulate authentication.
          </div>
          <form method="POST" action="/api/login">
            <input name="userId" placeholder="User ID (e.g., dev-user-1)" required />
            <input name="email" placeholder="Email (optional)" />
            <input name="firstName" placeholder="First Name" value="Dev" />
            <input name="lastName" placeholder="Last Name" value="User" />
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `);
  });

  // Handle local login
  app.post("/api/login", async (req, res) => {
    const { userId, email, firstName, lastName } = req.body;

    if (!userId) {
      return res.status(400).send("User ID is required");
    }

    // Upsert user in database
    await authStorage.upsertUser({
      id: userId,
      email: email || `${userId}@local.dev`,
      firstName: firstName || "Dev",
      lastName: lastName || "User",
      profileImageUrl: null,
    });

    // Create session with same structure as Replit auth
    const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 1 week
    (req.session as any).user = {
      claims: {
        sub: userId,
        email: email || `${userId}@local.dev`,
        first_name: firstName || "Dev",
        last_name: lastName || "User",
        exp: expiresAt,
      },
      expires_at: expiresAt,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Failed to save session");
      }
      res.redirect("/");
    });
  });

  // Callback route (not used in local auth, but keep for compatibility)
  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > user.expires_at) {
    return res.status(401).json({ message: "Session expired" });
  }

  // Attach user to request for compatibility with existing code
  (req as any).user = user;
  return next();
};
