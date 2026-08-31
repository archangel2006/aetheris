import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const IslandScene = lazy(() => import("@/components/world/IslandScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aetheris — An Explorable Floating Island in 3D" },
      {
        name: "description",
        content:
          "Orbit, zoom and explore Aetheris: a tiny low-poly floating island diorama with a skymill, lighthouse, waterfall and hidden secrets.",
      },
      { property: "og:title", content: "Aetheris — An Explorable Floating Island in 3D" },
      {
        property: "og:description",
        content: "A hand-built low-poly island you can rotate, zoom and poke at. Six points of interest, one secret.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Loader() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-[var(--sky)]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="mt-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">Unmooring the island…</p>
      </div>
    </div>
  );
}

function Index() {
  return (
    <main>
      <ClientOnly fallback={<Loader />}>
        <Suspense fallback={<Loader />}>
          <IslandScene />
        </Suspense>
      </ClientOnly>
    </main>
  );
}
