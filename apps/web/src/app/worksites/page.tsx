"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { MapPin, Plus, ChevronRight, Pencil, Trash2, Building } from "lucide-react";
import { Id } from "@packages/backend/convex/_generated/dataModel";

// Define worksite interface
interface Worksite {
  _id: Id<"worksites">;
  name: string;
  address: string;
  tenantId: Id<"tenants">;
  tenantName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

export default function Worksites() {
  const worksites = useQuery(api.worksites.listForUser) as Worksite[] | undefined;
  const deleteWorksite = useMutation(api.worksites.deleteWorksite);
  
  const [isDeleting, setIsDeleting] = useState<Id<"worksites"> | null>(null);

  const handleDeleteWorksite = async (worksiteId: Id<"worksites">) => {
    try {
      setIsDeleting(worksiteId);
      await deleteWorksite({ worksiteId });
    } catch (error) {
      console.error("Failed to delete worksite:", error);
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
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Worksites</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your organization's worksites and their geofences.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              href="/worksites/new"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <span className="flex items-center">
                <Plus className="h-4 w-4 mr-1" />
                Add worksite
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                {worksites && worksites.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Address
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Organization
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Geofence Radius
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {worksites.map((worksite) => (
                        <tr key={worksite._id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-indigo-100 rounded-full">
                                <MapPin className="h-5 w-5 text-indigo-600" />
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{worksite.name}</div>
                                <div className="text-gray-500">ID: {worksite._id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {worksite.address}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-400 mr-1" />
                              <span>{worksite.tenantName}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {worksite.radius} meters
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/worksites/${worksite._id}`}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                Details <ChevronRight className="h-4 w-4 ml-1" />
                              </Link>
                              <Link
                                href={`/worksites/${worksite._id}/edit`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteWorksite(worksite._id)}
                                disabled={isDeleting === worksite._id}
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
                    <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No worksites</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new worksite.</p>
                    <div className="mt-6">
                      <Link
                        href="/worksites/new"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Add worksite
                      </Link>
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