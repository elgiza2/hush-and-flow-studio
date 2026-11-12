import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { showsLanding } from "@/config/domains";

// Landing domains (ceyo.si, ceyo.app) show the landing page; every other host
// is the Ceyo app. Both are lazy so the landing never downloads the app boot.
const isLanding = typeof window !== "undefined" && showsLanding(window.location.host, window.location.search);
// Start the app download as soon as this route loads, exactly like a static import.
const spaModule = typeof window !== "undefined" && !isLanding ? import("@/lib/spaMount") : null;
const SpaMount = lazy(() => (spaModule ?? import("@/lib/spaMount")).then((m) => ({ default: m.SpaMount })));
const CeyoLanding = lazy(() => import("@/components/landing/CeyoLanding"));

function Home() {
  const landing = isLanding;
  return <Suspense fallback={null}>{landing ? <CeyoLanding /> : <SpaMount />}</Suspense>;
}

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
  head: () => ({
    meta: [
      { title: "Ceyo — Your Personal Bots and Group Chats" },
      {
        name: "description",
        content:
          "Meet your main Ceyo bot, create personal bots, coordinate group chats and pick up every conversation from one calm home.",
      },
      { property: "og:title", content: "Ceyo — Your Personal Bots and Group Chats" },
      {
        property: "og:description",
        content:
          "Create personal bots and coordinated group chats, then continue every conversation from one clean, animated home.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ceyo — Your Personal Bots and Group Chats" },
      {
        name: "twitter:description",
        content:
          "Create personal bots and coordinated group chats, then continue every conversation from one clean, animated home.",
      },
    ],
  }),
});
