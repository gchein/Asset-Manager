import { z } from 'zod';
import {
  insertCompanySchema,
  insertProjectSchema,
  insertJobSchema,
  insertMessageSchema,
  insertWarrantySchema,
  insertCommissionItemSchema,
  companies,
  projects,
  jobs,
  messages,
  jobHistory,
  warranties,
  commissionItems,
  ppaDocuments,
  insertProfileSchema,
  profiles
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  })
};

export const api = {
  // === Companies ===
  companies: {
    list: {
      method: 'GET' as const,
      path: '/api/companies',
      responses: {
        200: z.array(z.custom<typeof companies.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/companies',
      input: insertCompanySchema,
      responses: {
        201: z.custom<typeof companies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // === Profiles ===
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>().nullable(),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },

  // === Projects ===
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      input: z.object({
        companyId: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof projects.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: insertProjectSchema,
      responses: {
        201: z.custom<typeof projects.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.custom<typeof projects.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },

  // === Jobs ===
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      input: z.object({
        projectId: z.string().optional(),
        status: z.string().optional(),
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect & { project: typeof projects.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs',
      input: insertJobSchema,
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.custom<typeof jobs.$inferSelect & { project: typeof projects.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/jobs/:id',
      input: insertJobSchema.partial(),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },

  // === Messages ===
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs/:jobId/messages',
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect & { user: { firstName: string | null, lastName: string | null } }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs/:jobId/messages',
      input: insertMessageSchema.omit({ jobId: true, userId: true }),
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // === History ===
  history: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs/:jobId/history',
      responses: {
        200: z.array(z.custom<typeof jobHistory.$inferSelect & { user: { firstName: string | null, lastName: string | null } }>()),
      },
    },
  },

  // === Warranties ===
  warranties: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs/:jobId/warranties',
      responses: {
        200: z.array(z.custom<typeof warranties.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs/:jobId/warranties',
      input: insertWarrantySchema.omit({ jobId: true }),
      responses: {
        201: z.custom<typeof warranties.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },

  // === PPA Documents ===
  ppaDocuments: {
    sendContract: {
      method: 'POST' as const,
      path: '/api/projects/:id/send-contract',
      responses: {
        201: z.custom<typeof ppaDocuments.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/projects/:id/ppa-documents',
      responses: {
        200: z.array(z.custom<typeof ppaDocuments.$inferSelect>()),
      },
    },
    checkStatus: {
      method: 'POST' as const,
      path: '/api/ppa-documents/:id/check-status',
      responses: {
        200: z.custom<typeof ppaDocuments.$inferSelect>(),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      },
    },
  },

  // === Commission Items ===
  commissions: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs/:jobId/commissions',
      responses: {
        200: z.array(z.custom<typeof commissionItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/jobs/:jobId/commissions',
      input: insertCommissionItemSchema.omit({ jobId: true }),
      responses: {
        201: z.custom<typeof commissionItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
