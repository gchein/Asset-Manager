import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Re-export auth models
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["installer", "roofer", "ops", "engineer"]);
export const companyTypeEnum = pgEnum("company_type", ["installer", "roofer", "ops", "engineer"]);
export const jobTypeEnum = pgEnum("job_type", ["engineering", "r_and_r"]);
export const jobStatusEnum = pgEnum("job_status", [
  "new", 
  "submitted", 
  "assigned", 
  "in_progress", 
  "needs_revision", 
  "completed", 
  "cancelled"
]);

// Tables
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: companyTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id),
  role: userRoleEnum("role").notNull(),
  companyId: integer("company_id").references(() => companies.id),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  utility: text("utility"),
  companyId: integer("company_id").references(() => companies.id).notNull(), // The company that owns/created the project
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  type: jobTypeEnum("type").notNull(),
  status: jobStatusEnum("status").default("new").notNull(),
  
  // Assignments
  assignedEngineerId: text("assigned_engineer_id").references(() => users.id),

  // Flexible data storage for survey forms, specific job details
  details: jsonb("details").$type<Record<string, any>>().default({}), 
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  isRevisionRequest: boolean("is_revision_request").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobHistory = pgTable("job_history", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(), // e.g., "status_change", "assignment", "upload"
  details: text("details"), // Description of the change
  createdAt: timestamp("created_at").defaultNow(),
});

export const warranties = pgTable("warranties", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  issueDate: timestamp("issue_date").notNull(),
  term: text("term").notNull(), // e.g., "10 years"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commissionItems = pgTable("commission_items", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // stored in cents
  isCommissionable: boolean("is_commissionable").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  profiles: many(profiles),
  projects: many(projects),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [profiles.companyId],
    references: [companies.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  project: one(projects, {
    fields: [jobs.projectId],
    references: [projects.id],
  }),
  assignedEngineer: one(users, {
    fields: [jobs.assignedEngineerId],
    references: [users.id],
  }),
  messages: many(messages),
  history: many(jobHistory),
  warranties: many(warranties),
  commissionItems: many(commissionItems),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  job: one(jobs, {
    fields: [messages.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertProfileSchema = createInsertSchema(profiles);
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertWarrantySchema = createInsertSchema(warranties).omit({ id: true, createdAt: true });
export const insertCommissionItemSchema = createInsertSchema(commissionItems).omit({ id: true, createdAt: true });

// Types
export type Company = typeof companies.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type JobHistory = typeof jobHistory.$inferSelect;
export type Warranty = typeof warranties.$inferSelect;
export type CommissionItem = typeof commissionItems.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertWarranty = z.infer<typeof insertWarrantySchema>;
export type InsertCommissionItem = z.infer<typeof insertCommissionItemSchema>;

// Detailed Types for API
export type ProjectWithJobs = Project & { jobs: Job[] };
export type JobWithDetails = Job & { 
  project: Project; 
  assignedEngineer?: { id: string, firstName: string | null, lastName: string | null };
};
