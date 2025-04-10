import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { QueryInitializer } from "convex/server";

/**
 * Seed the database with test data
 *
 * This script creates:
 * - 3 test users
 * - 2 tenants (companies)
 * - Multiple worksites for each tenant
 * - User-tenant and user-worksite relationships
 */
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("Starting database seeding...");

    // 1. Create test users
    const users = await createTestUsers(ctx);

    // 2. Create test tenants and add users as members
    const tenants = await createTestTenants(ctx, users);

    // 3. Create test worksites for each tenant
    const worksites = await createTestWorksites(ctx, tenants, users);

    console.log("Database seeding completed successfully");

    return {
      users,
      tenants,
      worksites,
    };
  },
});

/**
 * Create test users
 */
async function createTestUsers(ctx: any) {
  console.log("Creating test users...");

  const testUsers = [
    {
      name: "Admin User",
      email: "admin@example.com",
      clerkId: "user_test_admin",
      profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      name: "Manager User",
      email: "manager@example.com",
      clerkId: "user_test_manager",
      profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
      name: "Worker User",
      email: "worker@example.com",
      clerkId: "user_test_worker",
      profilePicture: "https://randomuser.me/api/portraits/men/3.jpg",
    },
  ];

  const userIds: Record<string, Id<"users">> = {};

  for (const user of testUsers) {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", user.clerkId))
      .unique();

    if (existingUser) {
      console.log(`User ${user.name} already exists, skipping...`);
      userIds[user.clerkId] = existingUser._id;
    } else {
      const userId = await ctx.db.insert("users", user);
      console.log(`Created user: ${user.name}`);
      userIds[user.clerkId] = userId;
    }
  }

  return userIds;
}

/**
 * Create test tenants and add users as members
 */
async function createTestTenants(
  ctx: any,
  userIds: Record<string, Id<"users">>,
) {
  console.log("Creating test tenants...");

  const testTenants = [
    {
      name: "Acme Corporation",
      description: "A global construction company",
      logoUrl: "https://placehold.co/100x100?text=ACME",
    },
    {
      name: "TechBuild Inc",
      description: "Technology and infrastructure company",
      logoUrl: "https://placehold.co/100x100?text=TB",
    },
  ];

  const tenantIds: { id: Id<"tenants">; name: string }[] = [];

  for (const tenant of testTenants) {
    // Create the tenant
    const tenantId = await ctx.db.insert("tenants", tenant);
    console.log(`Created tenant: ${tenant.name}`);
    tenantIds.push({ id: tenantId, name: tenant.name });

    // Assign users to tenants with different roles
    await ctx.db.insert("userTenants", {
      userId: userIds["user_test_admin"],
      tenantId,
      role: "admin",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("userTenants", {
      userId: userIds["user_test_manager"],
      tenantId,
      role: "manager",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("userTenants", {
      userId: userIds["user_test_worker"],
      tenantId,
      role: "member",
      joinedAt: Date.now(),
    });

    console.log(`Added users to tenant: ${tenant.name}`);
  }

  return tenantIds;
}

/**
 * Create test worksites for each tenant
 */
async function createTestWorksites(
  ctx: any,
  tenants: { id: Id<"tenants">; name: string }[],
  userIds: Record<string, Id<"users">>,
) {
  console.log("Creating test worksites...");

  const worksitesData = [
    // Acme Corporation worksites
    {
      tenantId: tenants[0].id,
      name: "Acme HQ",
      description: "Main headquarters building",
      address: "123 Main St, San Francisco, CA",
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
      radius: 200,
    },
    {
      tenantId: tenants[0].id,
      name: "Acme Construction Site Alpha",
      description: "Major construction project",
      address: "456 Market St, San Francisco, CA",
      coordinates: {
        latitude: 37.7775,
        longitude: -122.4164,
      },
      radius: 500,
    },
    // TechBuild Inc worksites
    {
      tenantId: tenants[1].id,
      name: "TechBuild Office Tower",
      description: "Modern office complex",
      address: "789 Broadway, New York, NY",
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      radius: 150,
    },
    {
      tenantId: tenants[1].id,
      name: "TechBuild Research Campus",
      description: "R&D facility",
      address: "101 Innovation Dr, Boston, MA",
      coordinates: {
        latitude: 42.3601,
        longitude: -71.0589,
      },
      radius: 300,
    },
  ];

  const worksiteIds: Id<"worksites">[] = [];

  for (const worksite of worksitesData) {
    // Create the worksite
    const worksiteId = await ctx.db.insert("worksites", worksite);
    console.log(`Created worksite: ${worksite.name}`);
    worksiteIds.push(worksiteId);

    // Add geofence for the worksite (simple circular boundary based on coordinates and radius)
    await ctx.db.insert("geofences", {
      worksiteId,
      name: `${worksite.name} Primary Boundary`,
      description: `Main geofence for ${worksite.name}`,
      coordinates: generateCircleCoordinates(
        worksite.coordinates.latitude,
        worksite.coordinates.longitude,
        worksite.radius,
      ),
      isActive: true,
    });

    // Add users to the worksite with different roles
    await ctx.db.insert("userWorksites", {
      userId: userIds["user_test_admin"],
      worksiteId,
      role: "admin",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("userWorksites", {
      userId: userIds["user_test_manager"],
      worksiteId,
      role: "supervisor",
      joinedAt: Date.now(),
    });

    await ctx.db.insert("userWorksites", {
      userId: userIds["user_test_worker"],
      worksiteId,
      role: "worker",
      joinedAt: Date.now(),
    });

    console.log(`Added users to worksite: ${worksite.name}`);
  }

  return worksiteIds;
}

/**
 * Generate coordinates for a circular boundary
 * This creates a simple polygon approximation of a circle
 */
function generateCircleCoordinates(
  centerLat: number,
  centerLng: number,
  radiusInMeters: number,
) {
  const coordinates = [];
  const numPoints = 16; // Number of points to approximate the circle

  // Convert radius from meters to approximate degrees
  // This is a simplified conversion that works reasonably well for small areas
  const radiusInDegrees = radiusInMeters / 111000; // ~111km per degree at the equator

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lat = centerLat + radiusInDegrees * Math.cos(angle);
    const lng =
      centerLng +
      (radiusInDegrees * Math.sin(angle)) /
        Math.cos(centerLat * (Math.PI / 180));
    coordinates.push([lat, lng]);
  }

  // Close the polygon by repeating the first point
  coordinates.push(coordinates[0]);

  return coordinates;
}

/**
 * Clear all test data
 * CAUTION: This will delete all data in the database!
 */
export const clearTestData = mutation({
  args: {
    confirmation: v.string(),
  },
  handler: async (ctx, args) => {
    // Safety check to prevent accidental deletion
    if (args.confirmation !== "DELETE_ALL_TEST_DATA") {
      throw new Error(
        'To confirm deletion, pass "DELETE_ALL_TEST_DATA" as the confirmation parameter',
      );
    }

    console.log("Clearing all test data...");

    // Delete data in reverse order of dependencies

    // 1. Delete user-worksite relationships
    const userWorksites = await ctx.db.query("userWorksites").collect();
    for (const record of userWorksites) {
      await ctx.db.delete(record._id);
    }

    // 2. Delete geofences
    const geofences = await ctx.db.query("geofences").collect();
    for (const record of geofences) {
      await ctx.db.delete(record._id);
    }

    // 3. Delete worksites
    const worksites = await ctx.db.query("worksites").collect();
    for (const record of worksites) {
      await ctx.db.delete(record._id);
    }

    // 4. Delete user-tenant relationships
    const userTenants = await ctx.db.query("userTenants").collect();
    for (const record of userTenants) {
      await ctx.db.delete(record._id);
    }

    // 5. Delete tenants
    const tenants = await ctx.db.query("tenants").collect();
    for (const record of tenants) {
      await ctx.db.delete(record._id);
    }

    // 6. Delete users with test clerk IDs
    const testUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("clerkId"), "user_test_admin"),
          q.eq(q.field("clerkId"), "user_test_manager"),
          q.eq(q.field("clerkId"), "user_test_worker"),
        ),
      )
      .collect();

    for (const user of testUsers) {
      await ctx.db.delete(user._id);
    }

    console.log("All test data has been cleared");

    return { success: true };
  },
});
