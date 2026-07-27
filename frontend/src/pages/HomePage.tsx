import { useEffect, useState } from "react";

import { getHealth } from "@/api/endpoints/health";
import CategorySelector from "@/components/categories/CategorySelector";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ConnectionState = "checking" | "online" | "offline";

/**
 * Landing/dashboard page.
 *
 * Verifies frontend/backend connectivity and lets the user pick a category
 * that is fetched dynamically from the backend workbook. Question
 * generation itself is not implemented yet - selecting a category is
 * currently just a UI-level selection.
 */
export default function HomePage() {
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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
          Select a category below to get started. Question generation logic has not been
          implemented yet — categories are already fully data-driven from the backend
          workbook.
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
          <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Loaded dynamically from every sheet in the backend&apos;s questions workbook.
          </p>
        </div>
        <CategorySelector
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </section>

      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected category: {selectedCategoryId}</CardTitle>
            <CardDescription>
              Question generation for this category is not implemented yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Coming soon
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
