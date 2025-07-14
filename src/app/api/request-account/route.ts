import { db } from "@/server/db";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestAccountSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  phone: z.string().optional(),
  purpose: z.string().min(10),
  clubName: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, phone, purpose, clubName, password } =
      requestAccountSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await hash(password, 12);
    }

    // Create new user with PENDING state
    const user = await db.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: "CLUB_MEMBER",
        state: "PENDING",
        // Store additional info in a note (could extend schema later)
      },
    });

    // TODO: Notify admins about new account request
    // This could be done via email, database notification, etc.

    return NextResponse.json({
      message:
        "Account request submitted successfully. You will be notified when approved.",
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error creating account request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
