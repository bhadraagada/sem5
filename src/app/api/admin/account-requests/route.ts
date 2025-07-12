import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

// Mock data for account requests (replace with actual database calls)
const mockRequests = [
  {
    id: "req_1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@student.college.edu",
    phoneNumber: "+1234567890",
    userType: "STUDENT" as const,
    studentId: "STU001",
    year: "2024",
    semester: "Spring",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    reasonForAccess: "I need access to the college resource booking system to reserve computer labs for my final year project. I am working on a machine learning project that requires access to GPU-enabled workstations.",
    intendedUse: "I plan to use the system to book computer labs with GPU access for training machine learning models. I will primarily need access during evening hours and weekends when the labs are less occupied.",
    requestedRole: "CLUB_MEMBER",
    status: "PENDING" as const,
    submittedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "req_2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@faculty.college.edu",
    phoneNumber: "+1234567891",
    userType: "FACULTY" as const,
    employeeId: "FAC001",
    department: "Electronics Engineering",
    designation: "Assistant Professor",
    reasonForAccess: "As a new faculty member, I need access to the resource management system to book laboratories and equipment for my courses. I teach embedded systems and IoT courses that require specialized lab equipment.",
    intendedUse: "I will use the system to book electronics labs, reserve equipment like oscilloscopes and microcontrollers, and schedule demonstrations for my students. I also need to coordinate with other faculty for shared resources.",
    requestedRole: "DEPT_COORD",
    status: "UNDER_REVIEW" as const,
    submittedAt: "2024-01-14T09:15:00Z",
  },
  {
    id: "req_3",
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@research.college.edu",
    phoneNumber: "+1234567892",
    userType: "RESEARCHER" as const,
    employeeId: "RES001",
    department: "Mechanical Engineering",
    designation: "Research Scholar",
    reasonForAccess: "I am a PhD research scholar working on additive manufacturing. I need access to the resource booking system to reserve 3D printers and other fabrication equipment for my research work.",
    intendedUse: "I will primarily use the system to book 3D printing facilities, CNC machines, and testing equipment. My research requires extended usage sessions, so I need to plan and book resources well in advance.",
    requestedRole: "RESOURCE_MANAGER",
    status: "APPROVED" as const,
    submittedAt: "2024-01-13T14:45:00Z",
  },
];

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role;
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // In a real app, fetch from database:
    // const requests = await db.accountRequest.findMany({
    //   orderBy: { createdAt: "desc" },
    //   include: { user: true },
    // });

    return NextResponse.json({
      success: true,
      requests: mockRequests,
    });
  } catch (error) {
    console.error("Failed to fetch account requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
