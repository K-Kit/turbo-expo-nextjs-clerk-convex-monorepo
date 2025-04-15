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
      // Shape type: "polygon", "circle", etc.
      type: v.string(),
      // For polygon: Store polygon coordinates as an array of [lat, lng] pairs
      // For other types, this can be empty or contain specific points
      coordinates: v.array(v.array(v.number())),
      // For circle: center point and radius
      center: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
      radius: v.optional(v.number()), // in meters
      name: v.string(),
      description: v.optional(v.string()),
      // Style properties
      strokeColor: v.optional(v.string()),
      strokeWidth: v.optional(v.number()),
      fillColor: v.optional(v.string()),
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

    // POIs table
    pois: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      location: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      type: v.string(), // "hazard", "safety_equipment", etc.
      status: v.string(), // "active", "inactive", etc.
      tenantId: v.id("tenants"),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_tenant_type", ["tenantId", "type"])
      .index("by_tenant_status", ["tenantId", "status"]),

    // Assets table
    assets: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      location: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      type: v.string(), // "vehicle", "equipment", etc.
      status: v.string(), // "operational", "maintenance", "out_of_service"
      tenantId: v.id("tenants"),
      assignedTo: v.optional(v.id("users")),
      lastUpdated: v.number(),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_tenant_type", ["tenantId", "type"])
      .index("by_tenant_status", ["tenantId", "status"])
      .index("by_assigned_user", ["assignedTo"]),

    // Asset history table
    assetHistory: defineTable({
      assetId: v.id("assets"),
      location: v.object({
        lat: v.number(),
        lng: v.number(),
      }),
      status: v.string(),
      timestamp: v.number(),
      updatedBy: v.id("users"),
    })
      .index("by_asset", ["assetId"])
      .index("by_asset_time", ["assetId", "timestamp"]),
      
    // Projects table
    projects: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      tenantId: v.id("tenants"),
      worksiteId: v.optional(v.id("worksites")),
      status: v.string(), // "planned", "in_progress", "completed", "on_hold", "cancelled"
      priority: v.string(), // "low", "medium", "high", "critical"
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      budget: v.optional(v.number()),
      managerId: v.optional(v.id("users")),
      teamMembers: v.optional(v.array(v.id("users"))),
      tags: v.optional(v.array(v.string())),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_worksite", ["worksiteId"])
      .index("by_manager", ["managerId"])
      .index("by_tenant_status", ["tenantId", "status"])
      .index("by_dates", ["tenantId", "startDate", "endDate"]),
      
    // Project tasks table
    projectTasks: defineTable({
      projectId: v.id("projects"),
      name: v.string(),
      description: v.optional(v.string()),
      status: v.string(), // "todo", "in_progress", "completed", "blocked"
      assignedTo: v.optional(v.id("users")),
      dueDate: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_project", ["projectId"])
      .index("by_assignee", ["assignedTo"])
      .index("by_project_status", ["projectId", "status"]),
      
    // Work Orders table
    workOrders: defineTable({
      tenantId: v.id("tenants"),
      number: v.string(), // Work order number (e.g., "WO-2023-001")
      title: v.string(),
      description: v.optional(v.string()),
      status: v.string(), // "open", "in_progress", "completed", "on_hold", "cancelled"
      priority: v.string(), // "low", "medium", "high", "critical"
      type: v.string(), // "maintenance", "inspection", "repair", "installation", "other"
      projectId: v.optional(v.id("projects")), // Related project (optional)
      assetId: v.optional(v.id("assets")), // Related asset (optional)
      location: v.optional(v.object({
        lat: v.number(),
        lng: v.number(),
      })),
      assignedTeam: v.optional(v.id("users")), // Team assigned to the work order
      assignedTo: v.optional(v.id("users")), // Individual assigned to the work order
      dueDate: v.optional(v.number()),
      startDate: v.optional(v.number()),
      completedDate: v.optional(v.number()),
      estimatedHours: v.optional(v.number()),
      actualHours: v.optional(v.number()),
      cost: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      attachments: v.optional(v.array(v.id("_storage"))), // References to uploaded files
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_tenant_status", ["tenantId", "status"])
      .index("by_tenant_type", ["tenantId", "type"])
      .index("by_tenant_priority", ["tenantId", "priority"])
      .index("by_project", ["projectId"])
      .index("by_asset", ["assetId"])
      .index("by_assigned_team", ["assignedTeam"])
      .index("by_assigned_to", ["assignedTo"])
      .index("by_dates", ["tenantId", "dueDate"]),
      
    // Work Order Tasks table
    workOrderTasks: defineTable({
      workOrderId: v.id("workOrders"),
      name: v.string(),
      description: v.optional(v.string()),
      status: v.string(), // "pending", "in_progress", "completed"
      assignedTo: v.optional(v.id("users")),
      estimatedHours: v.optional(v.number()),
      actualHours: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_work_order", ["workOrderId"])
      .index("by_status", ["workOrderId", "status"])
      .index("by_assignee", ["assignedTo"]),
      
    // Work Order Comments table
    workOrderComments: defineTable({
      workOrderId: v.id("workOrders"),
      authorId: v.id("users"),
      text: v.string(),
      attachments: v.optional(v.array(v.id("_storage"))),
      createdAt: v.number(),
    })
      .index("by_work_order", ["workOrderId"])
      .index("by_author", ["authorId"])
      .index("by_work_order_time", ["workOrderId", "createdAt"]),
      
    // Contractors table (contractor organizations)
    contractors: defineTable({
      tenantId: v.id("tenants"),
      name: v.string(),
      description: v.optional(v.string()),
      contactName: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      contactPhone: v.optional(v.string()),
      address: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      status: v.string(), // "active", "inactive", "suspended"
      tags: v.optional(v.array(v.string())),
      reviews: v.optional(v.array(v.object({
        reviewerId: v.id("users"),
        rating: v.number(), // 1-5 rating
        comment: v.optional(v.string()),
        createdAt: v.number(),
      }))),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_tenant", ["tenantId"])
      .index("by_tenant_status", ["tenantId", "status"]),
      
    // Contractor Profiles table (individual contractor employees/workers)
    contractorProfiles: defineTable({
      contractorId: v.id("contractors"),
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      role: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      certifications: v.optional(v.array(v.string())),
      status: v.string(), // "active", "inactive"
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_contractor", ["contractorId"])
      .index("by_email", ["email"]),
      
    // Contractor Assignments table (linking contractors to work orders)
    contractorAssignments: defineTable({
      contractorId: v.id("contractors"),
      contractorProfileId: v.optional(v.id("contractorProfiles")),
      workOrderId: v.id("workOrders"),
      projectId: v.optional(v.id("projects")),
      startDate: v.optional(v.number()),
      endDate: v.optional(v.number()),
      status: v.string(), // "scheduled", "in_progress", "completed", "cancelled"
      notes: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_contractor", ["contractorId"])
      .index("by_contractor_profile", ["contractorProfileId"])
      .index("by_work_order", ["workOrderId"])
      .index("by_project", ["projectId"]),

    userLocations: defineTable({
      userId: v.string(),
      tenantId: v.id("tenants"),
      timestamp: v.number(),
      coordinates: v.object({
        latitude: v.number(),
        longitude: v.number(),
        accuracy: v.optional(v.number()),
        altitude: v.optional(v.number()),
        speed: v.optional(v.number()),
        heading: v.optional(v.number()),
      }),
      isTracking: v.boolean(),
      deviceInfo: v.optional(v.string()),
      batteryLevel: v.optional(v.number()),
    }).index("by_user_tenant", ["userId", "tenantId"])
      .index("by_tenant_timestamp", ["tenantId", "timestamp"])
      .index("by_user_timestamp", ["userId", "timestamp"]),
  },
  {
    schemaValidation: false,
    strictTableNameTypes: false,
  },
);
