"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
              Jai Hind College
            </h2>
            <p className="mt-2 text-center text-lg text-gray-600">
              College Management System
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/auth/signin"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </Link>

            <Link
              href="/request-account"
              className="group relative w-full flex justify-center py-3 px-4 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request Account Access
            </Link>
          </div>

          <div className="mt-8">
            <Link
              href="/api/public/calendar"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              View Public Calendar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (session.user.state === "PENDING") {
    if (session.user.role === "ORG_ADMIN") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Setup</h2>
            <p className="mt-2 text-gray-600">Please complete the admin onboarding process.</p>
            <Link
              href="/onboarding/admin"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue Setup
            </Link>
          </div>
        </div>
      );
    } else if (session.user.role === "DEPT_COORD") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
            <p className="mt-2 text-gray-600">Please complete your faculty profile.</p>
            <Link
              href="/onboarding/faculty"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Account Pending</h2>
            <p className="mt-2 text-gray-600">Your account is awaiting approval.</p>
            <Link
              href="/pending-approval"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
              View Status
            </Link>
          </div>
        </div>
      );
    }
  }

  // Active user dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Jai Hind College
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user.name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {session.user.role}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.user.role === "ORG_ADMIN" && (
              <Link
                href="/admin"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
                <p className="text-gray-600">Manage users, departments, and college settings.</p>
              </Link>
            )}

            <Link
              href="/calendar"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calendar</h3>
              <p className="text-gray-600">View and manage events and bookings.</p>
            </Link>

            <Link
              href="/resources"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resources</h3>
              <p className="text-gray-600">Book rooms and equipment.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
