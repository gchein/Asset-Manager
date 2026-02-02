import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type errorSchemas } from "@shared/routes";
import { z } from "zod";
import type { 
  InsertCompany, InsertProfile, InsertProject, InsertJob, InsertMessage, InsertWarranty, InsertCommissionItem 
} from "@shared/schema";

// --- Companies ---
export function useCompanies() {
  return useQuery({
    queryKey: [api.companies.list.path],
    queryFn: async () => {
      const res = await fetch(api.companies.list.path);
      if (!res.ok) throw new Error("Failed to fetch companies");
      return api.companies.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertCompany) => {
      const res = await fetch(api.companies.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create company");
      return api.companies.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.companies.list.path] }),
  });
}

// --- Profiles ---
export function useMyProfile() {
  return useQuery({
    queryKey: [api.profiles.me.path],
    queryFn: async () => {
      const res = await fetch(api.profiles.me.path, { credentials: "include" });
      if (res.status === 401) return null; // Unauthenticated
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.profiles.me.responses[200].parse(await res.json());
    },
    retry: false,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProfile) => {
      const res = await fetch(api.profiles.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create profile");
      return api.profiles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.profiles.me.path] }),
  });
}

export function useEngineers() {
  return useQuery({
    queryKey: ["/api/users/engineers"],
    queryFn: async () => {
      const res = await fetch("/api/users/engineers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch engineers");
      return res.json() as Promise<{ id: string; firstName: string | null; lastName: string | null }[]>;
    },
  });
}

// --- Projects ---
export function useProjects(companyId?: string) {
  return useQuery({
    queryKey: [api.projects.list.path, { companyId }],
    queryFn: async () => {
      const url = companyId 
        ? `${api.projects.list.path}?companyId=${companyId}`
        : api.projects.list.path;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return api.projects.list.responses[200].parse(await res.json());
    },
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: [api.projects.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.projects.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch project");
      return api.projects.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProject) => {
      const res = await fetch(api.projects.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create project");
      return api.projects.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.projects.list.path] }),
  });
}

// --- Jobs ---
interface UseJobsFilters {
  projectId?: string;
  status?: string;
  type?: string;
}

export function useJobs(filters?: UseJobsFilters) {
  return useQuery({
    queryKey: [api.jobs.list.path, filters],
    queryFn: async () => {
      let url = api.jobs.list.path;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.projectId) params.append("projectId", filters.projectId);
        if (filters.status) params.append("status", filters.status);
        if (filters.type) params.append("type", filters.type);
        url += `?${params.toString()}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch job");
      return api.jobs.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertJob) => {
      const res = await fetch(api.jobs.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create job");
      return api.jobs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] }),
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertJob> }) => {
      const url = buildUrl(api.jobs.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update job");
      return api.jobs.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.get.path, data.id] });
    },
  });
}

// --- Messages ---
export function useMessages(jobId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, jobId],
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { jobId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!jobId,
    refetchInterval: 5000, // Poll for new messages
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: number; data: Omit<InsertMessage, "jobId" | "userId"> }) => {
      const url = buildUrl(api.messages.create.path, { jobId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, jobId] });
    },
  });
}

// --- Warranties ---
export function useWarranties(jobId: number) {
  return useQuery({
    queryKey: [api.warranties.list.path, jobId],
    queryFn: async () => {
      const url = buildUrl(api.warranties.list.path, { jobId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch warranties");
      return api.warranties.list.responses[200].parse(await res.json());
    },
    enabled: !!jobId,
  });
}

export function useCreateWarranty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, data }: { jobId: number; data: Omit<InsertWarranty, "jobId"> }) => {
      const url = buildUrl(api.warranties.create.path, { jobId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, issueDate: new Date(data.issueDate).toISOString() }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create warranty");
      return api.warranties.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: [api.warranties.list.path, jobId] });
    },
  });
}
