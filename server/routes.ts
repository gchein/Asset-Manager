import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Helper to get user from request
  const requireUser = (req: any) => {
    if (!req.user) throw new Error("Unauthorized");
    return req.user;
  };

  // === Companies ===
  app.get(api.companies.list.path, isAuthenticated, async (req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.post(api.companies.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.companies.create.input.parse(req.body);
      const company = await storage.createCompany(input);
      res.status(201).json(company);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Profiles ===
  app.get(api.profiles.me.path, isAuthenticated, async (req: any, res) => {
    const profile = await storage.getProfile(req.user.claims.sub);
    res.json(profile || null);
  });

  app.get("/api/users/engineers", isAuthenticated, async (req: any, res) => {
    // Only Ops can list all engineers
    const profile = await storage.getProfile(req.user.claims.sub);
    if (profile?.role !== "ops") return res.status(403).json({ message: "Forbidden" });

    const results = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(profiles.role, "engineer"));

    res.json(results);
  });

  app.get("/api/users/company/:companyId", isAuthenticated, async (req: any, res) => {
    const companyId = parseInt(req.params.companyId);
    const results = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      role: profiles.role
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(profiles.companyId, companyId));

    res.json(results);
  });

  app.post(api.profiles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.profiles.create.input.parse(req.body);
      // Ensure users can only create their own profile
      if (input.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const profile = await storage.createProfile(input);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Projects ===
  app.get(api.projects.list.path, isAuthenticated, async (req: any, res) => {
    // Access Control: 
    // Ops: see all
    // Others: see only their company's projects
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    
    if (!profile) return res.status(403).json({ message: "Profile required" });

    let projects;
    if (profile.role === "ops") {
      projects = await storage.getProjects(); // All
    } else {
      if (!profile.companyId) return res.status(400).json({ message: "Company required" });
      projects = await storage.getProjects(profile.companyId);
    }
    
    res.json(projects);
  });

  app.post(api.projects.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      // Ensure companyId matches user's company (unless ops)
      const profile = await storage.getProfile(req.user.claims.sub);
      if (!profile) return res.status(403).json({ message: "Profile required" });

      if (profile.role !== "ops" && input.companyId !== profile.companyId) {
         return res.status(403).json({ message: "Cannot create project for another company" });
      }

      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.projects.get.path, isAuthenticated, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    // TODO: Check access rights
    res.json(project);
  });

  // === Jobs ===
  app.get(api.jobs.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) return res.status(403).json({ message: "Profile required" });

    // Parse filters
    const query = req.query; // express query is string | undefined
    const projectId = query.projectId ? Number(query.projectId) : undefined;
    
    const filters: any = { projectId };

    if (profile.role === "ops") {
      // See all
    } else if (profile.role === "engineer") {
      // See assigned
      filters.assignedToId = userId;
    } else {
      // Installer/Roofer: See company's
      filters.companyId = profile.companyId;
    }

    const jobs = await storage.getJobs(filters);
    res.json(jobs);
  });

  app.post(api.jobs.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.jobs.create.input.parse(req.body);
      // Validate rights...
      const job = await storage.createJob(input);
      
      // Log history
      await storage.logJobHistory({
        jobId: job.id,
        userId: req.user.claims.sub,
        action: "created",
        details: "Job created"
      });

      res.status(201).json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.jobs.get.path, isAuthenticated, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  });

  app.put(api.jobs.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.jobs.update.input.parse(req.body);
      const jobId = Number(req.params.id);
      
      // Check previous status for history
      const previousJob = await storage.getJob(jobId);
      
      const job = await storage.updateJob(jobId, input);

      // Log relevant changes
      if (input.status && previousJob && input.status !== previousJob.status) {
         await storage.logJobHistory({
           jobId,
           userId: req.user.claims.sub,
           action: "status_change",
           details: `Status changed from ${previousJob.status} to ${input.status}`
         });
      }

      if (input.assignedEngineerId && previousJob && input.assignedEngineerId !== previousJob.assignedEngineerId) {
          await storage.logJobHistory({
             jobId,
             userId: req.user.claims.sub,
             action: "assignment",
             details: `Engineer assigned`
          });
      }

      res.json(job);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === Messages ===
  app.get(api.messages.list.path, isAuthenticated, async (req, res) => {
    const messages = await storage.getMessages(Number(req.params.jobId));
    res.json(messages);
  });

  app.post(api.messages.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const jobId = Number(req.params.jobId);
      const input = api.messages.create.input.parse(req.body);
      
      const message = await storage.createMessage({
        ...input,
        jobId,
        userId: req.user.claims.sub,
      });

      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === History ===
  app.get(api.history.list.path, isAuthenticated, async (req, res) => {
    const history = await storage.getJobHistory(Number(req.params.jobId));
    res.json(history);
  });

  // === Warranties ===
  app.get(api.warranties.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getWarranties(Number(req.params.jobId));
    res.json(items);
  });

  app.post(api.warranties.create.path, isAuthenticated, async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const input = api.warranties.create.input.parse(req.body);
        const item = await storage.createWarranty({ ...input, jobId });
        res.status(201).json(item);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
        throw err;
    }
  });

  // === Commissions ===
  app.get(api.commissions.list.path, isAuthenticated, async (req, res) => {
    const items = await storage.getCommissionItems(Number(req.params.jobId));
    res.json(items);
  });

  app.post(api.commissions.create.path, isAuthenticated, async (req, res) => {
    try {
        const jobId = Number(req.params.jobId);
        const input = api.commissions.create.input.parse(req.body);
        const item = await storage.createCommissionItem({ ...input, jobId });
        res.status(201).json(item);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
        throw err;
    }
  });

  // Seed data function (simple check if companies exist)
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingCompanies = await storage.getCompanies();
  if (existingCompanies.length === 0) {
    console.log("Seeding database...");
    
    // Create Companies
    const opsCompany = await storage.createCompany({ name: "Solar Ops HQ", type: "ops" });
    const installerCompany = await storage.createCompany({ name: "Sunny Installers Inc", type: "installer" });
    const rooferCompany = await storage.createCompany({ name: "Top Roofing LLC", type: "roofer" });
    const engCompany = await storage.createCompany({ name: "Precision Engineering", type: "engineer" });

    // Note: We can't easily seed users because of Replit Auth's UUIDs and external auth flow.
    // Users will be created upon login.
    // However, we can create projects/jobs linked to these companies.

    const project1 = await storage.createProject({
      customerName: "Alice Johnson",
      address: "123 Maple Ave",
      city: "Springfield",
      state: "IL",
      zipCode: "62704",
      utility: "City Power",
      companyId: installerCompany.id
    });

    await storage.createJob({
      projectId: project1.id,
      type: "engineering",
      status: "new",
      details: { notes: "Please survey roof." }
    });

    const project2 = await storage.createProject({
      customerName: "Bob Smith",
      address: "456 Oak St",
      city: "Shelbyville",
      state: "IL",
      zipCode: "62565",
      utility: "County Electric",
      companyId: rooferCompany.id
    });

    await storage.createJob({
      projectId: project2.id,
      type: "r_and_r",
      status: "in_progress",
      details: { roofType: "Shingle" }
    });

    console.log("Database seeded!");
  }
}
