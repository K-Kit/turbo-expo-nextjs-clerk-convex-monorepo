import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema(
  {
    notes: defineTable({
      userId: v.string(),
      title: v.string(),
      content: v.string(),
      summary: v.optional(v.string()),
    }),

    // Users table - for authentication and user management
    users: defineTable({
      name: v.string(),
      email: v.optional(v.string()),
      // Store the Clerk user ID
      clerkId: v.string(),
      // Optional profile picture URL
      profilePicture: v.optional(v.string()),
      tokenIdentifier: v.optional(v.string()),
    })
      .index("by_clerk_id", ["clerkId"])
      .index("by_email", ["email"])
      .index("by_token", ["tokenIdentifier"]),

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
      coordinates: v.optional(
        v.object({
          latitude: v.number(),
          longitude: v.number(),
        }),
      ),
      // Add radius in meters for circular geofencing
      radius: v.optional(v.number()),
    }).index("by_tenant", ["tenantId"]),

    // Incidents table - for tracking safety incidents
    incidents: defineTable({
      // Relations
      tenantId: v.id("tenants"),
      worksiteId: v.optional(v.id("worksites")),
      reportedById: v.id("users"),
      assignedToId: v.optional(v.id("users")),
      
      // Incident details
      title: v.string(),
      description: v.string(),
      incidentType: v.string(), // e.g., "injury", "near_miss", "hazard", "property_damage"
      status: v.string(), // e.g., "reported", "investigating", "resolved", "closed"
      severity: v.string(), // e.g., "low", "medium", "high", "critical"
      
      // Location
      location: v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
      address: v.optional(v.string()),
      
      // Timestamps
      reportedAt: v.number(), // When the incident was reported
      occuredAt: v.optional(v.number()), // When the incident actually happened
      resolvedAt: v.optional(v.number()), // When the incident was resolved
      
      // Additional fields
      tags: v.optional(v.array(v.string())),
      images: v.optional(v.array(v.id("_storage"))), // References to uploaded images
      actionTaken: v.optional(v.string()),
      preventativeMeasures: v.optional(v.string()),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_worksite", ["worksiteId"])
      .index("by_reporter", ["reportedById"])
      .index("by_assignee", ["assignedToId"])
      .index("by_status", ["tenantId", "status"])
      .index("by_type", ["tenantId", "incidentType"])
      .index("by_severity", ["tenantId", "severity"])
      .index("by_date", ["tenantId", "reportedAt"]),

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
      joinedAt: v.optional(v.number()), // timestamp
    })
      .index("by_user", ["userId"])
      .index("by_tenant", ["tenantId"])
      .index("by_user_and_tenant", ["userId", "tenantId"]),

    // User-Worksite relationships (many-to-many)
    userWorksites: defineTable({
      userId: v.id("users"),
      worksiteId: v.id("worksites"),
      role: v.string(), // admin, member, etc.
      assignedAt: v.optional(v.number()), // timestamp
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

    // Pending invites for users who haven't registered yet
    pendingInvites: defineTable({
      email: v.string(),
      tenantId: v.id("tenants"),
      role: v.string(), // admin, member, etc.
      status: v.string(), // pending, accepted, declined
      inviteCode: v.string(), // unique code for accepting invitation
      invitedBy: v.id("users"), // user who sent the invitation
      invitedAt: v.number(), // timestamp when invitation was sent
      expiresAt: v.optional(v.number()), // optional expiration timestamp
    })
      .index("by_email", ["email"])
      .index("by_tenant", ["tenantId"])
      .index("by_invite_code", ["inviteCode"])
      .index("by_email_and_tenant", ["email", "tenantId"]),
  },
  {
    schemaValidation: false,
    strictTableNameTypes: false,
  },
);
