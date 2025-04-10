"use client";

import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import Header from "@/components/Header";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Building2, Users, Map, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { user } = useUser();
  const [greeting, setGreeting] = useState("");

  // Fetch tenants for the current user
  const tenants = useQuery(api.tenants.list);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Stats cards for dashboard
  const stats = [
    {
      name: "Total Tenants",
      value: tenants?.length || 0,
      icon: Building2,
      href: "/tenants",
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "Active Check-ins",
      value: "Coming soon",
      icon: Clock,
      href: "/check-ins",
      color: "bg-green-100 text-green-800",
    },
    {
      name: "Total Worksites",
      value: "Coming soon",
      icon: Map,
      href: "/worksites",
      color: "bg-purple-100 text-purple-800",
    },
    {
      name: "Team Members",
      value: "Coming soon",
      icon: Users,
      href: "/team",
      color: "bg-orange-100 text-orange-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.firstName || "there"}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to your GeoFence Pro dashboard. Here's an overview of your account.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link href={stat.href} key={stat.name}>
              <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
                <dt>
                  <div className={`absolute rounded-md p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </dd>
                <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-2 sm:px-6">
                  <div className="text-sm">
                    <span className="font-medium text-indigo-600 hover:text-indigo-700">
                      View all<span className="sr-only"> {stat.name}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-10">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <div className="mt-4 bg-white shadow rounded-lg">
            {tenants && tenants.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <div key={tenant._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{tenant.name}</h3>
                        <p className="text-sm text-gray-500">Role: {tenant.role}</p>
                      </div>
                      <Link 
                        href={`/tenants/${tenant._id}`} 
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No recent activity found</p>
                <div className="mt-6">
                  <Link 
                    href="/tenants/create" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create your first tenant
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 