import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const H = lazy(() => import("@/dev/Harness"));
export const Route = createFileRoute("/zz-harness")({ ssr: false, component: () => <Suspense fallback={null}><H /></Suspense> });
