"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { BrandLock } from "@/components/layout/Brand";
import { Button, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f6f7fb] px-5">
      <BrandLock size={40} />
      <div className="mt-6 w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for has moved or no longer exists."
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              <Button as={Link} href="/home">
                Home
              </Button>
              <Button as={Link} href="/courses" variant="outline">
                Browse courses
              </Button>
            </div>
          }
        />
      </div>
    </div>
  );
}
