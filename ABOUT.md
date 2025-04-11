Below is the updated README document that now includes a comprehensive **Notifications** module. In this system, notifications may be attached to most entities (POI, asset, project, work order, etc.) and support scheduling multiple reminder times with messages. Notifications can be assigned to multiple people and set as repeatable.

---

# Multi-Tenant WorkSafeMaps Platform

This project builds a multi-tenant map-based safety and operations platform within a Turborepo monorepo. The repository consists of:

- **Backend (/packages/backend):**  
  Convex functions implement persistent state management, real-time updates, and server-side logic.
- **Web (/apps/web):**  
  A Next.js application provides a comprehensive web UI for managing worksites, incidents, projects, work orders, contractor management, notifications, and more.
- **Native (/apps/native):**  
  An Expo-powered mobile app delivers native functionality for operations and real-time data access on the go.

Inspired by worksafemaps.com, the platform supports multi-tenant worksite management, incident reporting, team management, asset & POI tracking, alerts, projects, work orders, contractor management, and now an integrated notifications module.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Monorepo Structure](#monorepo-structure)
- [Application Architecture](#application-architecture)
- [Backend Implementation (Convex)](#backend-implementation-convex)
  - [Schema (schema.ts)](#schema-schemat)
  - [RBAC and Tenant Isolation](#rbac-and-tenant-isolation)
  - [Queries & Mutations](#queries--mutations)
- [Frontend Integration](#frontend-integration)
  - [Web Application (Next.js)](#web-application-nextjs)
  - [Native Mobile Application (Expo)](#native-mobile-application-expo)
  - [Tenant Context, Real-Time Updates & Notifications Integration](#tenant-context-real-time-updates--notifications-integration)
- [Integration Flow](#integration-flow)
- [Getting Started](#getting-started)
- [Notes](#notes)
- [License](#license)

---

## Project Overview

The **Multi-Tenant WorkSafeMaps Platform** is an integrated solution enabling multiple organizations (tenants) to manage safety, operations, and worksite activities using an interactive map interface. Key functionalities include:

- **Multi-Tenant Architecture:**  
  Isolated data scopes for each organization.
- **Worksite & Incident Management:**  
  Define geographic worksites, report incidents, and track related assets.
- **Team & User Management:**  
  Role-based access across teams and tenants.
- **Asset & POI Management:**  
  Track assets and designate points of interest.
- **Alerts:**  
  Configure and trigger alerts based on incidents or asset status changes.
- **Project & Work Order Management:**  
  Organize projects linked to worksites and manage work orders that can be assigned to assets, teams, or individuals.
- **Contractor Management:**  
  Manage contractor organizations and individual profiles, associating contractor work with projects and work orders.
- **Notifications Module:**  
  Attach notifications to various entities (e.g., POI, asset, project, work order). Schedule one or more reminder times with custom messages. Notifications can be assigned to multiple individuals and set as repeatable.
- **Real-Time Updates & Interactive Mapping:**  
  Instant updates driven by Convex, with interactive maps across platforms (web and native) displaying multiple data layers.

---

## Monorepo Structure

This project uses a Turborepo monorepo to streamline development and shared tooling across different parts of the system. The main directories are:

```plaintext
/packages
  /backend        # Convex backend functions and schema
/apps
  /web            # Next.js application for web interface
  /native         # Expo application for native mobile experience
```

This structure promotes code reuse and simplifies dependency management across backend and front-end applications.

---

## Application Architecture

The system is built around a clear separation of concerns:

1. **Convex Backend (/packages/backend):**  
   - Hosts the multi-tenant schema including collections for tenants, worksites, teams, incidents, assets, POIs, alerts, projects, work orders, contractors, and now notifications.
   - Organizes functions into modular files (e.g., tenants.ts, worksites.ts, incidents.ts, projects.ts, workorders.ts, contractors.ts, notifications.ts).
   - Enforces RBAC and tenant-based isolation.

2. **Next.js Web Application (/apps/web):**  
   - Connects to the Convex backend using hooks (`useQuery`, `useMutation`).
   - Provides UI components for managing all aspects of the platform: worksites, incidents, projects, work orders, contractor management, and notifications.
   - Displays an interactive, real-time map.

3. **Expo Native Application (/apps/native):**  
   - Offers mobile-friendly access to operational data.
   - Mirrors core functionalities from the web app to support on-the-go operations and to manage notifications and other real-time updates.

---

## Backend Implementation (Convex)

### Schema (schema.ts)

The Convex schema defines several collections, now including notifications:

- **tenants:** Stores tenant organization details.
- **userTenantMemberships:** Links users to tenants with role information.
- **worksites:** Contains geospatial and descriptive worksite data.
- **teams:** Manages team details for each tenant.
- **teamMemberships:** Maps users to teams.
- **incidents:** Tracks incident reports with details and geolocation.
- **assets:** Stores asset-related data (location, type, status).
- **pois:** Records points of interest (hazards, safety equipment markers).
- **alerts:** Manages alert rules and triggers.
- **projects:** Holds project-related information linked with worksites.
- **workOrders:** Captures work orders linked to projects, assets, teams, and individuals.
- **contractors:** Manages contractor organizations and profiles.
- **notifications:**  
  - Stores notifications that can attach to multiple entities such as POI, asset, project, or work order.
  - Includes fields for one or more reminder times, a custom message, repeatability flag, and assignments to multiple people.
  - Supports linking with various entities via foreign keys or reference IDs to enable contextual notifications.

*Indexes and Relationships:*  
Key indexes (e.g., tenantId and foreign keys for linking notifications to other modules) ensure efficient queries. Data integrity is enforced by access control checks within each Convex function.

### RBAC and Tenant Isolation

- **User Context:**  
  All functions retrieve user information via `ctx.auth.getUserIdentity()`.
- **Permissions:**  
  Every function confirms that the user belongs to the current tenant (via `userTenantMemberships` or `teamMemberships`) and verifies role-based access.
- **Isolation:**  
  Tenant-based isolation guarantees users can access only the data permitted within their tenant.

### Queries & Mutations

Functions are organized into multiple files, each handling domain-specific logic. New functions for notifications are added in `notifications.ts`.

- **tenants.ts:**  
  - `getMyTenants`
  - `createTenant`
  - `inviteUserToTenant`
- **worksites.ts:**  
  - `getWorksites`
  - `createWorksite`
  - `updateWorksite`
- **incidents.ts:**  
  - `getIncidentsForWorksite`
  - `addIncident`
- **users.ts / teamManagement.ts:**  
  - `getTeamMembers`
  - `addUserToTeam`
  - `updateUserRole`
- **assets.ts:**  
  - `getAssets`
  - `updateAssetStatus`
- **pois.ts, alerts.ts:**  
  - Tenant-scoped functions to manage POIs and alerts.
- **projects.ts:**  
  - `getProjects`
  - `createProject`
  - `updateProject`
- **workorders.ts:**  
  - `getWorkOrders`
  - `createWorkOrder`
  - `updateWorkOrderStatus`
- **contractors.ts:**  
  - `getContractors`
  - `createContractor`
  - `updateContractor`
  - `assignContractorToWorkOrder`
- **notifications.ts:**  
  - `getNotifications` – Retrieve notifications for a given entity.
  - `createNotification` – Create a notification with one or more reminder times, message, repeatable option, and assignments to multiple users.
  - `updateNotification` – Modify an existing notification (e.g., update schedule or message).

Every function strictly enforces tenant-scoped data access and RBAC.

---

## Frontend Integration

### Web Application (Next.js)

- **Location:** `/apps/web`
- **Integration:**  
  Uses Convex hooks (`useQuery`, `useMutation`) to connect with backend functions.
- **Features:**  
  Provides comprehensive UI for managing all entities, including worksites, incidents, assets, alerts, projects, work orders, contractor profiles, and notifications.
- **Interactive Map:**  
  Implements dynamic map layers (via React Leaflet or similar) displaying real-time updates for all modules.

### Native Mobile Application (Expo)

- **Location:** `/apps/native`
- **Purpose:**  
  Delivers mobile-friendly access to platform data including notifications, ensuring users receive timely reminders on the go.
- **Features:**  
  Core functionality mirrors that of the web app, incorporating mobile-specific navigation and responsive components.

### Tenant Context, Real-Time Updates & Notifications Integration

- **Tenant Context Switching:**  
  Users can switch between tenants if they have access to multiple organizations; all queries and mutations use the currently selected tenant.
- **Real-Time Updates:**  
  Leveraging Convex’s real-time features, updates across incidents, projects, work orders, contractor assignments, and notifications are immediately visible.
- **Notifications UI:**  
  - Allows users to view notifications attached to various entities.
  - Offers interfaces for creating notifications with multiple reminder times, custom messages, repeatable schedules, and multi-user assignments.

---

## Integration Flow

1. **Authentication:**  
   Users sign in using the pre-configured Convex Auth system.
   
2. **Tenant Selection:**  
   Once logged in, users choose an active tenant, which governs all backend queries and mutations.
   
3. **Data Interaction:**  
   - Both web and native apps use hooks (`useQuery`, `useMutation`) to fetch tenant-scoped data.
   - Actions such as creating a worksite, reporting an incident, or setting a notification invoke Convex functions with RBAC checks.
   
4. **Real-Time Updates:**  
   Data (incidents, asset statuses, projects, work orders, contractor assignments, and notifications) is synchronized in real time across the system.
   
5. **Map Display:**  
   Interactive maps in both web and native apps display real-time layers of worksites, incidents, projects, work orders, and contextual notifications.

---

## Getting Started

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/worksafemaps-platform.git
   cd worksafemaps-platform
   ```

2. **Install Dependencies:**

   From the root directory (Turborepo), install dependencies for all packages and apps:

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Setup Convex Backend:**

   - Navigate to `/packages/backend`.
   - Configure your Convex deployment settings.
   - Update `convex/schema.ts` to include collections for projects, work orders, contractors, and notifications.
   - Deploy Convex functions using your preferred deployment commands.

4. **Setup Web Application:**

   - Go to `/apps/web`.
   - Configure your environment variables for Convex.
   - Run the development server:

     ```bash
     npm run dev
     # or
     yarn dev
     ```

5. **Setup Native Application:**

   - Go to `/apps/native`.
   - Configure environment variables as needed.
   - Start the Expo development server:

     ```bash
     npm start
     # or
     yarn start
     ```

6. **Authentication:**

   - Use the Convex Auth system to sign in.
   - Ensure that the authentication flow integrates seamlessly with tenant context and contractor roles.

7. **Usage:**

   - Once logged in and a tenant is selected, navigate through both web and native interfaces to manage worksites, incidents, alerts, assets, projects, work orders, contractor profiles, and notifications.
   - Use interactive maps to visualize real-time data and notification triggers.

---

## Notes

- **RBAC Enforcement:**  
  Every Convex function strictly verifies user permissions to maintain data integrity in a multi-tenant environment.
- **Progressive Enhancement:**  
  Focus first on primary features (multi-tenancy, worksite management, incident reporting, project/work order management) and progressively integrate modules such as contractor management and notifications.
- **Notifications Module Integration:**  
  The new notifications module attaches contextual alerts to many entities. Configure multiple reminder times, custom messages, and assign notifications to multiple users with optional repeatable scheduling.
- **Monorepo Benefits:**  
  The Turborepo structure centralizes dependency management and streamlines the shared configuration across backend, web, and native apps.
- **Data Integrity:**  
  Replace all placeholder or mock data with actual tenant-scoped data fetched from Convex.
- **Modular Frontend Components:**  
  Both web and native app components are built to be modular and scalable for future enhancements.
