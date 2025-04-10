"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, MapPin, Building, Edit, Users } from "lucide-react";
import { Id } from "@packages/backend/convex/_generated/dataModel";

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

export default function WorksiteDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const worksite = useQuery(api.worksites.get, { 
    worksiteId: id as Id<"worksites"> 
  }) as Worksite | null | undefined;
  
  const tenant = worksite ? useQuery(api.tenants.get, { 
    tenantId: worksite.tenantId 
  }) : undefined;

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
              href={`/worksites/${worksite._id}/edit`}
              className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Edit className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Edit Worksite
            </Link>
          </div>
        </div>

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
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Location Map</h3>
              <div className="bg-gray-100 h-64 rounded-md flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Map would be displayed here</p>
                  <p className="text-xs text-gray-400">
                    Lat: {worksite.coordinates.latitude}, Lng: {worksite.coordinates.longitude}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users Section - Placeholder */}
        <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Users</h3>
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <Users className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Manage Users
              </button>
            </div>
            <div className="bg-gray-50 text-center py-10 rounded-md">
              <Users className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No users assigned to this worksite yet</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 