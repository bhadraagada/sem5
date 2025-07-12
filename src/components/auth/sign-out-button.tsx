"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function SignOutButton({ variant = "outline", size = "sm", className }: SignOutButtonProps) {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign Out
    </Button>
  );
}
