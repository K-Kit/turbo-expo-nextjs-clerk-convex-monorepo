"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import Header from "@/components/Header";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Pencil,
  Trash2,
  Users,
  MapPin,
  Plus,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function TenantDetail() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const tenant = useQuery(api.tenants.get, {
    tenantId: tenantId as Id<"tenants">,
  });
  const users = useQuery(api.users.listByTenant, {
    tenantId: tenantId as Id<"tenants">,
  });
  const worksites = useQuery(api.worksites.listByTenant, {
    tenantId: tenantId as Id<"tenants">,
  });
  const pendingInvites = useQuery(api.users.listPendingInvites, {
    tenantId: tenantId as Id<"tenants">,
  });
  const deleteTenant = useMutation(api.tenants.removeTenant);
  const addUser = useMutation(api.users.addUserToTenant);
  const inviteUser = useMutation(api.users.inviteUserToTenant);
  const removeUser = useMutation(api.users.removeUserFromTenant);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const cancelInvite = useMutation(api.users.cancelInvite);

  // Get current user
  const currentUser = useQuery(api.users.me);
  const currentUserId = currentUser?._id;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("member");
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<Id<"users"> | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState<Id<"users"> | null>(
    null,
  );
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState<Id<"users"> | null>(
    null,
  );
  const [addUserSuccess, setAddUserSuccess] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteTenant({ id: tenantId as Id<"tenants"> });
      router.push("/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tenant");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAddingUser(true);
      setAddUserError(null);
      setAddUserSuccess(null);

      try {
        // First try to add an existing user
        await addUser({
          email: newUserEmail,
          role: newUserRole,
          tenantId: tenantId as Id<"tenants">,
        });

        setShowAddUserForm(false);
        setNewUserEmail("");
        setNewUserRole("member");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add user";

        // If the error is about a user not found, try sending an invitation instead
        if (errorMessage.includes("User not found")) {
          const result = await inviteUser({
            email: newUserEmail,
            role: newUserRole,
            tenantId: tenantId as Id<"tenants">,
          });

          setAddUserSuccess(result.message);
          setNewUserEmail("");
          setNewUserRole("member");
        } else {
          // For other errors, show the error message
          setAddUserError(errorMessage);
        }
      }
    } catch (err) {
      setAddUserError(
        err instanceof Error ? err.message : "Failed to process request",
      );
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = (userId: Id<"users">) => {
    setUserToRemove(userId);
  };

  const confirmRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setIsRemovingUser(userToRemove);
      await removeUser({
        userId: userToRemove,
        tenantId: tenantId as Id<"tenants">,
      });
      setUserToRemove(null);
      setIsRemovingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
      setIsRemovingUser(null);
    }
  };

  const handleRoleChange = async (userId: Id<"users">, newRole: string) => {
    try {
      setIsChangingRole(userId);
      await updateUserRole({
        userId,
        tenantId: tenantId as Id<"tenants">,
        role: newRole,
      });
      setIsChangingRole(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update user role",
      );
      setIsChangingRole(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite({ inviteId: inviteId as Id<"pendingInvites"> });
      toast({
        title: "Invitation canceled",
        description: "The invitation has been canceled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  if (!tenant) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500">Loading tenant details...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            href="/tenants"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to organizations
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center bg-indigo-100 rounded-full mr-4">
                <Building className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                  {tenant.name}
                </h2>
                {tenant.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {tenant.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href={`/tenants/${tenantId}/edit`}
              className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="ml-3 inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Tenant
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this tenant? This action cannot
                be undone. All associated worksites and data will be permanently
                removed.
              </p>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tenant Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Tenant Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Details about the organization.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {tenant.name}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    {tenant.description || "No description provided"}
                  </dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Your role
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {tenant.userRole}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Tenant Stats */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Tenant Overview
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Summary of tenant resources.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-gray-50 overflow-hidden rounded-lg shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Users
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {users?.length || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 overflow-hidden rounded-lg shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Worksites
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {worksites?.length || 0}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Worksites Section */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-gray-900">Worksites</h2>
              <p className="mt-2 text-sm text-gray-700">
                Manage worksites for this organization.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <Link
                href={`/worksites/new?tenantId=${tenantId}`}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Add worksite
                </span>
              </Link>
            </div>
          </div>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            {worksites && worksites.length > 0 ? (
              <ul role="list" className="divide-y divide-gray-200">
                {worksites.map((worksite) => (
                  <li key={worksite._id}>
                    <Link
                      href={`/worksites/${worksite._id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                              <MapPin className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {worksite.name}
                              </p>
                              {worksite.address && (
                                <p className="mt-1 text-sm text-gray-500 truncate">
                                  {worksite.address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            {worksite.userRole && (
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {worksite.userRole}
                              </p>
                            )}
                            <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-5 sm:p-6 text-center">
                <p className="text-sm text-gray-500">
                  No worksites found for this organization.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Get started by creating your first worksite.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Users Management Section */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
              <p className="mt-2 text-sm text-gray-700">
                Manage members of this organization.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <button
                onClick={() => setShowAddUserForm(true)}
                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <span className="flex items-center">
                  <Plus className="h-4 w-4 mr-1" />
                  Add user
                </span>
              </button>
            </div>
          </div>

          {/* Add User Form Dialog */}
          {showAddUserForm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add User to Organization
                </h3>

                {addUserError && (
                  <div className="mb-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {addUserError}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {addUserSuccess && (
                  <div className="mb-4 rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Success
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          {addUserSuccess}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddUser}>
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      User Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="user@example.com"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the user's email. Registered users will be added
                      immediately. Non-registered users will receive an
                      invitation via email.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="submit"
                      disabled={isAddingUser}
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    >
                      {isAddingUser
                        ? "Processing..."
                        : addUserSuccess
                          ? "Send Another"
                          : "Add User"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUserForm(false);
                        setAddUserError(null);
                        setAddUserSuccess(null);
                      }}
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    >
                      {addUserSuccess ? "Close" : "Cancel"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Remove User Confirmation Dialog */}
          {userToRemove && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900">
                  Remove User
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to remove this user from the
                  organization? They will lose access to all resources within
                  this organization.
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setUserToRemove(null)}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmRemoveUser}
                    disabled={isRemovingUser !== null}
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                  >
                    {isRemovingUser ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Display pending invites */}
          {pendingInvites && pendingInvites.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Pending Invitations</h3>
              <div className="mt-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite._id}
                    className="flex items-center justify-between p-2 border rounded mb-2"
                  >
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-sm text-gray-500">
                          Invited{" "}
                          {new Date(invite._creationTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {tenant.userRole === "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelInvite(invite._id)}
                      >
                        Cancel Invitation
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="mt-4 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          User
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Role
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users?.map((user) => (
                        <tr key={user._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {user.profilePicture ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={user.profilePicture}
                                    alt={user.name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500 font-medium">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user._id === currentUserId ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                {user.role}
                              </span>
                            ) : (
                              <select
                                value={user.role}
                                onChange={(e) =>
                                  handleRoleChange(user._id, e.target.value)
                                }
                                disabled={
                                  isChangingRole === user._id ||
                                  tenant.userRole !== "admin"
                                }
                                className="rounded-md border-gray-300 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="member">Member</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user._id !== currentUserId &&
                              tenant.userRole === "admin" && (
                                <button
                                  onClick={() => handleRemoveUser(user._id)}
                                  disabled={isRemovingUser === user._id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}

                      {/* Pending Invites Section */}
                      {pendingInvites && pendingInvites.length > 0 && (
                        <>
                          {pendingInvites.map((invite) => (
                            <tr key={invite._id} className="bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                      <span className="text-gray-500 font-medium">
                                        ?
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 flex items-center">
                                      {invite.email}
                                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Invited
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Invited{" "}
                                      {new Date(
                                        invite.invitedAt,
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  {invite.role} (pending)
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {tenant.userRole === "admin" && (
                                  <button
                                    onClick={() =>
                                      handleCancelInvite(
                                        invite._id as unknown as Id<"users">,
                                      )
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel Invite
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}

                      {(!users ||
                        (users.length === 0 &&
                          (!pendingInvites ||
                            pendingInvites.length === 0))) && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                          >
                            No users found in this organization.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
