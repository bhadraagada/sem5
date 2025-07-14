"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/" })}
      className="w-full"
      size="lg"
    >
      <Mail className="mr-2 h-4 w-4" />
      Continue with Google
    </Button>
  );
}
