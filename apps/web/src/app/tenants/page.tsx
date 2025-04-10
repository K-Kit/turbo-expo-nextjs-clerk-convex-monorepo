"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { Building, Plus, ChevronRight, Pencil, Trash2, MapPin } from "lucide-react";
import { Id } from "@packages/backend/convex/_generated/dataModel";

// Define tenant interface to match the backend response
interface Tenant {
  _id: Id<"tenants">;
  _creationTime: number;
  name: string;
  description?: string;
  logoUrl?: string;
  worksiteCount?: number;
  role: string;
}

export default function Tenants() {
//   const { user } = useUser();
  const tenants = useQuery(api.tenants.list) as Tenant[] | undefined;
  const createTenant = useMutation(api.tenants.create);
  const deleteTenant = useMutation(api.tenants.removeTenant);
  
  const [newTenantName, setNewTenantName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Id<"tenants"> | null>(null);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    
    try {
      await createTenant({ name: newTenantName });
      setNewTenantName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create tenant:", error);
    }
  };

  const handleDeleteTenant = async (tenantId: Id<"tenants">) => {
    try {
      setIsDeleting(tenantId);
      await deleteTenant({ id: tenantId });
    } catch (error) {
      console.error("Failed to delete tenant:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Tenants</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage organizations and their worksites in your geofencing application.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span className="flex items-center">
                <Plus className="h-4 w-4 mr-1" />
                Add tenant
              </span>
            </button>
          </div>
        </div>

        {isCreating && (
          <div className="mt-8 p-4 bg-white shadow sm:rounded-lg">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New Tenant</h3>
            <form onSubmit={handleCreateTenant} className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter organization name"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                {tenants && tenants.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Worksites
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Created On
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {tenants.map((tenant) => (
                        <tr key={tenant._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-indigo-100 rounded-full">
                                <Building className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{tenant.name}</div>
                                <div className="text-gray-500">ID: {tenant._id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{tenant.worksiteCount || 0} worksites</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(tenant._creationTime).toLocaleDateString()}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/tenants/${tenant._id}`}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                Details <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                              <Link
                                href={`/tenants/${tenant._id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteTenant(tenant._id)}
                                disabled={isDeleting === tenant._id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="bg-white px-4 py-12 text-center">
                    <Building className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No tenants</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new tenant.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setIsCreating(true)}
                        type="button"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add tenant
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 