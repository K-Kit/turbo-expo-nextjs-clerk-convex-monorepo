"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, MapPin, Building, Edit, Users, Plus, ChevronRight, Trash2, Pencil } from "lucide-react";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { MapView } from "@/components/map/MapView";

interface Worksite {
  _id: Id<"worksites">;
  name: string;
  tenantId: Id<"tenants">;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  userRole?: string;
}

interface Tenant {
  _id: Id<"tenants">;
  name: string;
}

export default function WorksiteDetail() {
  const params = useParams();
  const router = useRouter();
  const worksiteId = params.id as string;
  
  const worksite = useQuery(api.worksites.get, { worksiteId: worksiteId as Id<"worksites"> }) as Worksite | null | undefined;
  
  const tenant = useQuery(api.tenants.get, { 
    tenantId: worksite?.tenantId as Id<"tenants">
  });

  const worksiteUsers = useQuery(api.worksites.listWorksiteUsers, { worksiteId: worksiteId as Id<"worksites"> });
  const tenantUsers = useQuery(api.users.listByTenant, { tenantId: worksite?.tenantId as Id<"tenants"> });
  const deleteWorksite = useMutation(api.worksites.deleteWorksite);
  const addUser = useMutation(api.worksites.addUserToWorksite);
  const removeUser = useMutation(api.worksites.removeUserFromWorksite);
  const updateUserRole = useMutation(api.worksites.updateUserWorksiteRole);
  
  // Get current user
  const currentUser = useQuery(api.users.me);
  const currentUserId = currentUser?._id;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | "">("");
  const [newUserRole, setNewUserRole] = useState("member");
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<Id<"users"> | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState<Id<"users"> | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isChangingRole, setIsChangingRole] = useState<Id<"users"> | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteWorksite({ worksiteId: worksiteId as Id<"worksites"> });
      router.push(`/tenants/${worksite?.tenantId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete worksite");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setAddUserError("Please select a user");
      return;
    }
    
    try {
      setIsAddingUser(true);
      setAddUserError(null);
      await addUser({
        userId: selectedUserId as Id<"users">,
        worksiteId: worksiteId as Id<"worksites">,
        role: newUserRole
      });
      setShowAddUserForm(false);
      setSelectedUserId("");
      setNewUserRole("member");
      setIsAddingUser(false);
    } catch (err) {
      setAddUserError(err instanceof Error ? err.message : "Failed to add user");
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
        worksiteId: worksiteId as Id<"worksites">
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
        worksiteId: worksiteId as Id<"worksites">,
        role: newRole
      });
      setIsChangingRole(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user role");
      setIsChangingRole(null);
    }
  };

  // Get users who are in the tenant but not in the worksite
  const getAvailableUsers = () => {
    if (!tenantUsers || !worksiteUsers) return [];
    
    const worksiteUserIds = new Set(worksiteUsers.map(user => user._id));
    return tenantUsers.filter(user => !worksiteUserIds.has(user._id));
  };

  if (worksite === undefined) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex justify-center items-center">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (worksite === null) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <Link 
              href="/worksites" 
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to worksites
            </Link>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg p-6 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Worksite not found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The worksite you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <Link
                href="/worksites"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Go back to worksites
              </Link>
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
            href="/worksites" 
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to worksites
          </Link>
        </div>
        
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center">
              <MapPin className="h-8 w-8 mr-2 text-indigo-600" />
              {worksite.name}
            </h2>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href={`/worksites/${worksiteId}/edit`}
              className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Edit className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Edit Worksite
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
              <h3 className="text-lg font-medium text-gray-900">Delete Worksite</h3>
              <p className="mt-2 text-sm text-gray-500">
                Are you sure you want to delete this worksite? This action cannot be undone.
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
          {/* Main Details */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Worksite Information</h3>
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <dt className="text-sm font-medium text-gray-500">Organization</dt>
                  <dd className="mt-1 flex items-center text-sm text-gray-900">
                    <Building className="h-4 w-4 text-gray-400 mr-1" />
                    {tenant?.name || "Loading..."}
                  </dd>
                </div>
                
                <div className="sm:col-span-3">
                  <dt className="text-sm font-medium text-gray-500">Your Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {worksite.userRole || "Member"}
                  </dd>
                </div>
                
                <div className="sm:col-span-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {worksite.address}
                  </dd>
                </div>
                
                <div className="sm:col-span-6">
                  <dt className="text-sm font-medium text-gray-500">Geolocation</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    Latitude: {worksite.coordinates.latitude}, Longitude: {worksite.coordinates.longitude}
                  </dd>
                </div>
                
                <div className="sm:col-span-6">
                  <dt className="text-sm font-medium text-gray-500">Geofence Radius</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {worksite.radius} meters
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Map Placeholder - In a real app this would show a map */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
              <MapView />
          </div>
        </div>
        
        {/* Users Section */}
        <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Users</h3>
              <button
                type="button"
                onClick={() => setShowAddUserForm(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Add User
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* User list */}
            {worksiteUsers && worksiteUsers.length > 0 ? (
              <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {worksiteUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.profilePicture ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={user.profilePicture}
                                alt=""
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user._id === currentUserId ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {user.role}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user._id, e.target.value)}
                              disabled={isChangingRole === user._id}
                              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="member">Member</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user._id !== currentUserId && (
                            <button
                              onClick={() => handleRemoveUser(user._id)}
                              disabled={isRemovingUser === user._id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {isRemovingUser === user._id ? (
                                "Removing..."
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 text-center py-10 rounded-md">
                <Users className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No users assigned to this worksite yet</p>
              </div>
            )}

            {/* Add User Form */}
            {showAddUserForm && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900">Add User to Worksite</h3>
                  
                  {addUserError && (
                    <div className="mt-2 rounded-md bg-red-50 p-2">
                      <p className="text-sm text-red-700">{addUserError}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleAddUser} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                        User
                      </label>
                      <select
                        id="userId"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value as Id<"users">)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="">Select a user</option>
                        {getAvailableUsers().map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <select
                        id="role"
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                      </select>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="submit"
                        disabled={isAddingUser}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                      >
                        {isAddingUser ? "Adding..." : "Add User"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddUserForm(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Remove User Confirmation */}
            {userToRemove && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900">Remove User</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Are you sure you want to remove this user from the worksite? This action cannot be undone.
                  </p>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button
                      type="button"
                      onClick={confirmRemoveUser}
                      disabled={isRemovingUser !== null}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    >
                      {isRemovingUser ? "Removing..." : "Remove"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserToRemove(null)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 