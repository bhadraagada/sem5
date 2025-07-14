"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Step 1: College Profile
const collegeProfileSchema = z.object({
  name: z.string().min(2, "College name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
});

// Step 2: Buildings & Rooms
const buildingSchema = z.object({
  buildings: z.array(z.object({
    name: z.string().min(1, "Building name is required"),
    floors: z.number().min(1, "Floors must be at least 1"),
    rooms: z.array(z.object({
      name: z.string().min(1, "Room name is required"),
      capacity: z.number().min(1, "Capacity must be at least 1"),
      type: z.enum(["CLASSROOM", "LAB", "AUDITORIUM", "CONFERENCE"]),
    })),
  })),
});

// Step 3: Departments
const departmentSchema = z.object({
  departments: z.array(z.object({
    name: z.string().min(1, "Department name is required"),
  })),
});

// Step 4: Resources
const resourceSchema = z.object({
  resources: z.array(z.object({
    name: z.string().min(1, "Resource name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    notes: z.string().optional(),
  })),
});

type CollegeProfileForm = z.infer<typeof collegeProfileSchema>;
type BuildingForm = z.infer<typeof buildingSchema>;
type DepartmentForm = z.infer<typeof departmentSchema>;
type ResourceForm = z.infer<typeof resourceSchema>;

export default function AdminOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data storage
  const [collegeData, setCollegeData] = useState<CollegeProfileForm>({
    name: "Jai Hind College",
    address: "",
    city: "Mumbai",
    contactEmail: "",
    contactPhone: "",
  });

  const [buildingData, setBuildingData] = useState<BuildingForm>({
    buildings: [
      {
        name: "Main Building",
        floors: 3,
        rooms: [
          { name: "Room 101", capacity: 60, type: "CLASSROOM" },
        ],
      },
    ],
  });

  const [departmentData, setDepartmentData] = useState<DepartmentForm>({
    departments: [
      { name: "Computer Science" },
      { name: "Information Technology" },
    ],
  });

  const [resourceData, setResourceData] = useState<ResourceForm>({
    resources: [
      { name: "Projector", quantity: 10, notes: "Standard classroom projectors" },
      { name: "Microphone System", quantity: 5, notes: "Wireless microphone sets" },
    ],
  });

  const collegeForm = useForm<CollegeProfileForm>({
    resolver: zodResolver(collegeProfileSchema),
    defaultValues: collegeData,
  });

  const steps = [
    { number: 1, title: "College Profile", description: "Basic college information" },
    { number: 2, title: "Buildings & Rooms", description: "Physical infrastructure" },
    { number: 3, title: "Departments", description: "Academic departments" },
    { number: 4, title: "Resources", description: "Shared resources" },
  ];

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // Submit all the onboarding data
      const onboardingData = {
        college: collegeData,
        buildings: buildingData.buildings,
        departments: departmentData.departments,
        resources: resourceData.resources,
      };

      const response = await fetch("/api/admin/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingData),
      });

      if (response.ok) {
        router.push("/admin");
      } else {
        alert("Failed to complete onboarding");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">College Profile</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">College Name</label>
                <input
                  {...collegeForm.register("name")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  {...collegeForm.register("address")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  {...collegeForm.register("city")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  {...collegeForm.register("contactEmail")}
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  {...collegeForm.register("contactPhone")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Buildings & Rooms</h3>
            <p className="text-sm text-gray-600">
              Add your college buildings and rooms. You can modify these later.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                This is a simplified view. The actual implementation would have dynamic forms
                to add/remove buildings and rooms.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
            <p className="text-sm text-gray-600">
              Set up your academic departments. You can assign HODs later.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Default departments will be created. You can modify these in the admin panel.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Shared Resources</h3>
            <p className="text-sm text-gray-600">
              Define resources that can be shared across the college.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                Default resources will be created. You can manage these in the admin panel.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!session || session.user.role !== "ORG_ADMIN" || session.user.state !== "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Onboarding</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome! Let&apos;s set up your college system.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li
                    key={step.number}
                    className={`${stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""
                      } relative`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${step.number <= currentStep
                            ? "bg-blue-600 text-white"
                            : "bg-gray-300 text-gray-500"
                          }`}
                      >
                        {step.number}
                      </div>
                      <div className="ml-4 min-w-0">
                        <p
                          className={`text-sm font-medium ${step.number <= currentStep ? "text-blue-600" : "text-gray-500"
                            }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-sm text-gray-500">{step.description}</p>
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 ${step.number < currentStep ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Step Content */}
          <div className="px-6 py-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    collegeForm.handleSubmit((data) => {
                      setCollegeData(data);
                      setCurrentStep(currentStep + 1);
                    })();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Finishing..." : "Complete Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
