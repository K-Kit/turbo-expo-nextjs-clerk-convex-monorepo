import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
  }),
  
  // Users table - for authentication and user management
  users: defineTable({
    name: v.string(),
    email: v.string(),
    // Store the Clerk user ID
    clerkId: v.string(),
    // Optional profile picture URL
    profilePicture: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkId"]),
  
  // Tenants table - organizations/companies
  tenants: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
  }),
  
  // Worksites table - locations belonging to tenants
  worksites: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.optional(v.string()),
    // Add coordinates for simple geolocation
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    // Add radius in meters for circular geofencing
    radius: v.optional(v.number()),
  }).index("by_tenant", ["tenantId"]),
  
  // Geofences table - polygon boundaries for worksites
  geofences: defineTable({
    worksiteId: v.id("worksites"),
    // Store polygon coordinates as an array of [lat, lng] pairs
    coordinates: v.array(v.array(v.number())),
    name: v.string(),
    description: v.optional(v.string()),
    // Active status
    isActive: v.boolean(),
  }).index("by_worksite", ["worksiteId"]),
  
  // User-Tenant relationships (many-to-many)
  userTenants: defineTable({
    userId: v.id("users"),
    tenantId: v.id("tenants"),
    role: v.string(), // admin, member, etc.
    joinedAt: v.number(), // timestamp
  })
  .index("by_user", ["userId"])
  .index("by_tenant", ["tenantId"])
  .index("by_user_and_tenant", ["userId", "tenantId"]),
  
  // User-Worksite relationships (many-to-many)
  userWorksites: defineTable({
    userId: v.id("users"),
    worksiteId: v.id("worksites"),
    role: v.string(), // supervisor, worker, etc.
    joinedAt: v.number(), // timestamp
  })
  .index("by_user", ["userId"])
  .index("by_worksite", ["worksiteId"])
  .index("by_user_and_worksite", ["userId", "worksiteId"]),
  
  // Location check-ins
  checkIns: defineTable({
    userId: v.id("users"),
    worksiteId: v.id("worksites"),
    geofenceId: v.id("geofences"),
    timestamp: v.number(),
    coordinates: v.array(v.number()), // [lat, lng]
    type: v.string(), // "entry", "exit", "scheduled_check"
    isWithinGeofence: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_worksite", ["worksiteId"])
  .index("by_geofence", ["geofenceId"])
  .index("by_user_and_time", ["userId", "timestamp"])
  .index("by_worksite_and_time", ["worksiteId", "timestamp"]),
});
