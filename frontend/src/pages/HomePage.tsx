import { useEffect, useState } from "react";

import { getHealth } from "@/api/endpoints/health";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConnectionState = "checking" | "online" | "offline";

const plannedFeatures = [
  {
    title: "Upload Source Data",
    description: "Import Quran text and metadata from Excel workbooks.",
  },
  {
    title: "Generate Questions",
    description: "Automatically create competition questions from the source data.",
  },
  {
    title: "Export Results",
    description: "Download the generated question set as a formatted Excel file.",
  },
];

/**
 * Landing/dashboard page. Currently a scaffold placeholder: it verifies
 * frontend/backend connectivity and previews the planned feature set.
 * No business logic is implemented yet.
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
          This is the project scaffold. Business logic for generating questions has not
          been implemented yet — the layout, routing, and API wiring below are ready to
          build on.
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plannedFeatures.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Planned
              </span>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
