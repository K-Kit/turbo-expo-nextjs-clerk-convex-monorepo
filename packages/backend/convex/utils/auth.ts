import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

/**
 * Authentication utility functions
 */

/**
 * Get the authenticated user from the request context
 * @param ctx - The Convex request context
 * @returns Object containing userId and clerkId if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx | ActionCtx
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    return null;
  }

  return {
    userId: user._id,
    clerkId: identity.subject,
    name: user.name,
    email: user.email,
  };
}

/**
 * Require authentication - throws error if not authenticated
 * @param ctx - The Convex request context
 * @returns Object containing userId and clerkId
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const user = await getAuthenticatedUser(ctx);
  if (!user) {
    throw new ConvexError("Authentication required");
  }
  return user;
}

/**
 * Check if the authenticated user has access to a tenant
 * @param ctx - The Convex request context
 * @param tenantId - The tenant ID to check
 * @returns The user's role within the tenant, null if no access
 */
export async function checkTenantAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  tenantId: Id<"tenants">
) {
  const user = await requireAuth(ctx);

  const membership = await ctx.db
    .query("userTenants")
    .withIndex("by_user_and_tenant", (q: any) => 
      q.eq("userId", user.userId).eq("tenantId", tenantId)
    )
    .unique();

  if (!membership) {
    return null;
  }

  return membership.role;
}

/**
 * Require tenant access - throws error if no access
 * @param ctx - The Convex request context
 * @param tenantId - The tenant ID to check
 * @returns The user's role within the tenant
 */
export async function requireTenantAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  tenantId: Id<"tenants">
) {
  const role = await checkTenantAccess(ctx, tenantId);
  if (!role) {
    throw new ConvexError("You do not have access to this tenant");
  }
  return role;
}

/**
 * Check if the authenticated user has the required roles within a tenant
 * @param ctx - The Convex request context
 * @param tenantId - The tenant ID to check
 * @param requiredRoles - Array of allowed roles
 * @returns Boolean indicating if the user has one of the required roles
 */
export async function checkTenantRole(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  tenantId: Id<"tenants">,
  requiredRoles: string[]
) {
  const role = await checkTenantAccess(ctx, tenantId);
  if (!role) {
    return false;
  }

  return requiredRoles.includes(role);
}

/**
 * Require specific tenant role - throws error if no access or insufficient role
 * @param ctx - The Convex request context
 * @param tenantId - The tenant ID to check
 * @param requiredRoles - Array of allowed roles
 * @returns The user's role within the tenant
 */
export async function requireTenantRole(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  tenantId: Id<"tenants">,
  requiredRoles: string[]
) {
  const role = await requireTenantAccess(ctx, tenantId);
  if (!requiredRoles.includes(role)) {
    throw new ConvexError(`Required role: ${requiredRoles.join(" or ")}`);
  }
  return role;
}

/**
 * Check if the authenticated user has access to a worksite
 * @param ctx - The Convex request context
 * @param worksiteId - The worksite ID to check
 * @returns The user's role within the worksite, null if no access
 */
export async function checkWorksiteAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  worksiteId: Id<"worksites">
) {
  const user = await requireAuth(ctx);

  // First check direct worksite access
  const directAccess = await ctx.db
    .query("userWorksites")
    .withIndex("by_user_and_worksite", (q: any) => 
      q.eq("userId", user.userId).eq("worksiteId", worksiteId)
    )
    .unique();

  if (directAccess) {
    return directAccess.role;
  }

  // If no direct access, check tenant access through worksite's tenant
  const worksite = await ctx.db.get(worksiteId);
  if (!worksite) {
    return null;
  }

  const tenantRole = await checkTenantAccess(ctx, worksite.tenantId);
  if (!tenantRole || tenantRole !== "admin") {
    return null;
  }

  // Tenant admins have access to all worksites
  return "tenant_admin";
}

/**
 * Require worksite access - throws error if no access
 * @param ctx - The Convex request context
 * @param worksiteId - The worksite ID to check
 * @returns The user's role within the worksite
 */
export async function requireWorksiteAccess(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  worksiteId: Id<"worksites">
) {
  const role = await checkWorksiteAccess(ctx, worksiteId);
  if (!role) {
    throw new ConvexError("You do not have access to this worksite");
  }
  return role;
}

/**
 * Check if the authenticated user has the required roles within a worksite
 * @param ctx - The Convex request context
 * @param worksiteId - The worksite ID to check
 * @param requiredRoles - Array of allowed roles
 * @returns Boolean indicating if the user has one of the required roles
 */
export async function checkWorksiteRole(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  worksiteId: Id<"worksites">,
  requiredRoles: string[]
) {
  const role = await checkWorksiteAccess(ctx, worksiteId);
  if (!role) {
    return false;
  }

  // Tenant admins always have access
  if (role === "tenant_admin") {
    return true;
  }

  return requiredRoles.includes(role);
}

/**
 * Require specific worksite role - throws error if no access or insufficient role
 * @param ctx - The Convex request context
 * @param worksiteId - The worksite ID to check
 * @param requiredRoles - Array of allowed roles
 * @returns The user's role within the worksite
 */
export async function requireWorksiteRole(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  worksiteId: Id<"worksites">,
  requiredRoles: string[]
) {
  const role = await requireWorksiteAccess(ctx, worksiteId);
  
  // Tenant admins always have access
  if (role === "tenant_admin") {
    return role;
  }
  
  if (!requiredRoles.includes(role)) {
    throw new ConvexError(`Required role: ${requiredRoles.join(" or ")}`);
  }
  
  return role;
} 