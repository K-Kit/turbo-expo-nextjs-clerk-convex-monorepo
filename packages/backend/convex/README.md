# Geofencing Backend

This Convex backend provides the necessary APIs for a multi-tenant geofencing application. The system allows tenants (organizations) to manage worksites and geofences, and users can track their locations relative to defined geofences.

## Data Model

### Key Entities

- **Users**: Individual users who can belong to multiple tenants and worksites
- **Tenants**: Organizations that own worksites
- **Worksites**: Physical locations belonging to tenants
- **Geofences**: Polygon boundaries defining areas within worksites
- **Check-ins**: Location records when users enter/exit geofences

### Relationships

- Users can belong to multiple tenants (many-to-many)
- Users can be assigned to multiple worksites (many-to-many)
- Tenants can have multiple worksites (one-to-many)
- Worksites can have multiple geofences (one-to-many)

## Authentication & Authorization

Authentication is handled via Clerk, with role-based access control implemented in the backend:

### Tenant Roles

- **Admin**: Full access to manage the tenant, worksites, and users
- **Manager**: Can manage worksites and users
- **Member**: Basic access to tenant resources

### Worksite Roles

- **Admin**: Full access to manage the worksite and its geofences
- **Supervisor**: Can view all check-ins and manage some worksite settings
- **Worker**: Basic access to check in/out of worksites

## API Modules

### Users

- `users.getOrCreate`: Register or retrieve a user by Clerk ID
- `users.me`: Get the current authenticated user
- `users.get`: Get user by ID
- `users.search`: Search users by name or email
- `users.listByTenant`: List all users within a tenant

### Tenants

- `tenants.create`: Create a new tenant
- `tenants.list`: List all tenants for the current user
- `tenants.get`: Get tenant details
- `tenants.joinTenant`: Join a tenant (requires invite code implementation)

### Worksites

- `worksites.create`: Create a new worksite for a tenant
- `worksites.listByTenant`: List all worksites for a tenant
- `worksites.get`: Get worksite details
- `worksites.addUser`: Add a user to a worksite

### Geofences

- `geofences.create`: Create a new geofence for a worksite
- `geofences.listByWorksite`: List all geofences for a worksite
- `geofences.checkIn`: Record a check-in at the current location
- `geofences.getCheckInHistory`: Get check-in history for a user and worksite
- `geofences.getWorksiteCheckIns`: Get check-in data for all users in a worksite (admin only)

## Utility Modules

### Auth Utilities

Functions for authentication and authorization logic:

- `getAuthenticatedUser`: Get the current user from auth context
- `requireAuth`: Require authenticated user or throw error
- `checkTenantAccess`: Check if user has access to a tenant
- `requireTenantRole`: Require specific tenant role
- `checkWorksiteAccess`: Check if user has access to a worksite
- `requireWorksiteRole`: Require specific worksite role

### Geofencing Utilities

Functions for geofencing calculations:

- `isPointInPolygon`: Check if a point is inside a polygon
- `calculatePolygonArea`: Calculate the area of a polygon
- `calculateDistance`: Calculate distance between two points
- `findClosestPointOnPolygon`: Find closest point on polygon to a given point
- `isValidPolygon`: Validate polygon properties
- `ensureClosedPolygon`: Ensure polygon is properly closed

## Getting Started

1. Set up Clerk for authentication
2. Configure your frontend to use the Convex APIs
3. Create a tenant and add users
4. Define worksites with geofences
5. Implement location tracking and check-ins
