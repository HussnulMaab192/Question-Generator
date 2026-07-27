import { useEffect, useState } from "react";

import { getHealth } from "@/api/endpoints/health";
import CompetitionSetup from "@/components/competition/CompetitionSetup";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

type ConnectionState = "checking" | "online" | "offline";

/**
 * Landing page: verifies frontend/backend connectivity, then renders the
 * competition setup screen (category selection, per-category question
 * counts, live summary, and the "Generate Questions" call-to-action).
 * Question generation itself is not implemented yet.
 */
export default function HomePage() {
  const [connection, setConnection] = useState<ConnectionState>("checking");

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then(() => {
        if (isMounted) setConnection("online");
      })
      .catch(() => {
        if (isMounted) setConnection("offline");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Quran Competition Question Generator
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Select one or more categories, choose how many questions to draw from each, then
          generate the competition question set.
        </p>
      </section>

      <section className="flex items-center gap-3 rounded-lg border bg-card p-4">
        {connection === "checking" && <LoadingSpinner />}
        <span
          className={cn(
            "size-2.5 rounded-full",
            connection === "online" && "bg-emerald-500",
            connection === "offline" && "bg-red-500",
            connection === "checking" && "bg-muted-foreground/50",
          )}
        />
        <span className="text-sm font-medium">
          Backend API:{" "}
          {connection === "checking" && "checking connection…"}
          {connection === "online" && "connected"}
          {connection === "offline" && "unreachable (start the FastAPI server)"}
        </span>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Competition Setup</h2>
          <p className="text-sm text-muted-foreground">
            Categories are loaded dynamically from the backend&apos;s questions workbook.
          </p>
        </div>
        <CompetitionSetup />
      </section>
    </div>
  );
}
