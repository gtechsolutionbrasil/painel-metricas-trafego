"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending && (
        <LoaderCircle
          size={15}
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {pending ? pendingLabel : children}
    </button>
  );
}
