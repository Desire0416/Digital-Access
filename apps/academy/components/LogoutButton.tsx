"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { buttonClasses, cn, type ButtonVariant, type ButtonSize } from "@da/ui";

export function LogoutButton({
  variant = "ghost",
  size = "sm",
  className,
  label = "Déconnexion",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={cn(buttonClasses({ variant, size }), className)}
    >
      <LogOut size={16} />
      {label}
    </button>
  );
}
