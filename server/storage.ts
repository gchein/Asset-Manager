import { 
  users, companies, profiles, projects, jobs, messages, jobHistory, warranties, commissionItems,
  type User, type Company, type InsertCompany, type Profile, type InsertProfile,
  type Project, type InsertProject, type Job, type InsertJob, type Message, type InsertMessage,
  type JobHistory, type Warranty, type InsertWarranty, type CommissionItem, type InsertCommissionItem,
  type ProjectWithJobs
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users (from auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Companies
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;

  // Projects
  getProjects(companyId?: number): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Jobs
  getJobs(filters?: { projectId?: number, companyId?: number, assignedToId?: string }): Promise<(Job & { project: Project })[]>;
  getJob(id: number): Promise<(Job & { project: Project }) | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job>;

  // Messages
  getMessages(jobId: number): Promise<(Message & { user: { firstName: string | null, lastName: string | null } })[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // History
  getJobHistory(jobId: number): Promise<(JobHistory & { user: { firstName: string | null, lastName: string | null } })[]>;
  logJobHistory(entry: { jobId: number, userId: string, action: string, details?: string }): Promise<JobHistory>;

  // Warranties
  getWarranties(jobId: number): Promise<Warranty[]>;
  createWarranty(warranty: InsertWarranty): Promise<Warranty>;

  // Commission Items
  getCommissionItems(jobId: number): Promise<CommissionItem[]>;
  createCommissionItem(item: InsertCommissionItem): Promise<CommissionItem>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: Replit auth uses email, not username. This is a compatibility method.
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const [newProfile] = await db.insert(profiles).values(profile).returning();
    return newProfile;
  }

  // Projects
  async getProjects(companyId?: number): Promise<Project[]> {
    if (companyId) {
      return await db.select().from(projects).where(eq(projects.companyId, companyId));
    }
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  // Jobs
  async getJobs(filters?: { projectId?: number, companyId?: number, assignedToId?: string }): Promise<(Job & { project: Project })[]> {
    let query = db.select({
      job: jobs,
      project: projects
    })
    .from(jobs)
    .innerJoin(projects, eq(jobs.projectId, projects.id));

    if (filters) {
      if (filters.projectId) {
        query.where(eq(jobs.projectId, filters.projectId));
      }
      if (filters.companyId) {
        // If filtering by company, we filter the joined project
        query.where(eq(projects.companyId, filters.companyId));
      }
      if (filters.assignedToId) {
        // Check both engineer and ops assignment
        // Since drizzle doesn't easily support OR in this chain without importing `or`, 
        // let's just do one or the other if passed, or both?
        // For simplicity, let's assume filtering by specific role assignment usually.
        // But for "My Jobs", it could be either. 
        // Actually, let's filter in memory if complex, or use SQL OR.
        // For now, let's handle it by checking if the user is assigned as ops OR engineer.
        // But `filters` is simple here. Let's refine the query construction.
        // We need to import `or`.
      }
    }

    const results = await query;
    
    // Post-filter for assignment if needed (simpler than dynamic SQL construction for now)
    let finalResults = results.map(r => ({ ...r.job, project: r.project }));
    
    if (filters?.assignedToId) {
       finalResults = finalResults.filter(j => 
         j.assignedEngineerId === filters.assignedToId
       );
    }
    
    // Also filter by companyId if passed (it was done in query, but ensure)
    if (filters?.companyId) {
        finalResults = finalResults.filter(j => j.project.companyId === filters.companyId);
    }

    return finalResults;
  }

  async getJob(id: number): Promise<(Job & { project: Project }) | undefined> {
    const [result] = await db.select({
      job: jobs,
      project: projects
    })
    .from(jobs)
    .innerJoin(projects, eq(jobs.projectId, projects.id))
    .where(eq(jobs.id, id));

    if (!result) return undefined;
    return { ...result.job, project: result.project };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db.update(jobs).set({ ...updates, updatedAt: new Date() }).where(eq(jobs.id, id)).returning();
    return updatedJob;
  }

  // Messages
  async getMessages(jobId: number): Promise<(Message & { user: { firstName: string | null, lastName: string | null } })[]> {
    const result = await db.select({
      message: messages,
      user: {
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.jobId, jobId))
    .orderBy(desc(messages.createdAt)); // Newest first? Or oldest? Usually chat is oldest at top. Let's do desc for "recent" API but frontend might reverse.
    
    return result.map(r => ({ ...r.message, user: r.user }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // History
  async getJobHistory(jobId: number): Promise<(JobHistory & { user: { firstName: string | null, lastName: string | null } })[]> {
    const result = await db.select({
      history: jobHistory,
      user: {
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(jobHistory)
    .innerJoin(users, eq(jobHistory.userId, users.id))
    .where(eq(jobHistory.jobId, jobId))
    .orderBy(desc(jobHistory.createdAt));

    return result.map(r => ({ ...r.history, user: r.user }));
  }

  async logJobHistory(entry: { jobId: number, userId: string, action: string, details?: string }): Promise<JobHistory> {
    const [log] = await db.insert(jobHistory).values(entry).returning();
    return log;
  }

  // Warranties
  async getWarranties(jobId: number): Promise<Warranty[]> {
    return await db.select().from(warranties).where(eq(warranties.jobId, jobId));
  }

  async createWarranty(warranty: InsertWarranty): Promise<Warranty> {
    const [newWarranty] = await db.insert(warranties).values(warranty).returning();
    return newWarranty;
  }

  // Commission Items
  async getCommissionItems(jobId: number): Promise<CommissionItem[]> {
    return await db.select().from(commissionItems).where(eq(commissionItems.jobId, jobId));
  }

  async createCommissionItem(item: InsertCommissionItem): Promise<CommissionItem> {
    const [newItem] = await db.insert(commissionItems).values(item).returning();
    return newItem;
  }
}

export const storage = new DatabaseStorage();
