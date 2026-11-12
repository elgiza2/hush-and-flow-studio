import { useEffect, useMemo, useRef, useState } from "react";
import template from "./ceyo-landing.html?raw";
import orbCss from "@/styles/agent.css?raw";
import skyPainting from "@/assets/landing/sky-painting.jpg";
import { LANDING_COPY, detectLandingLang, type LandingLang } from "./landingContent";
import { PLAN_PRICES } from "@/lib/payments/plans";
import { webAppOrigin } from "@/config/domains";

const LANG_KEY = "ceyo-landing-lang";
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const orb = (color: string, size: number, state = "idle") => `<span class="o" data-c="${color}" data-s="${size}" data-st="${state}"></span>`;

/** Main landing page. Rendered inside an isolated frame so the app's dark theme never touches it. */
export default function CeyoLanding() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [lang, setLang] = useState<LandingLang>(() =>
    detectLandingLang(localStorage.getItem(LANG_KEY), new URLSearchParams(location.search).get("lang"), navigator.language),
  );

  const html = useMemo(() => {
    const copy = LANDING_COPY[lang];
    const ar = lang === "ar";
    const values: Record<string, string> = {
      ...copy.text,
      skyPainting,
      appUrl: `${webAppOrigin(location.host, location.origin)}/auth`,
    };
    const pricing = (["plus", "pro", "ultra"] as const).map((tier) => {
      const prices = PLAN_PRICES[tier];
      const annual = prices.yearly ? `<p class="annual">or $${prices.yearly}/year, billed annually</p>` : '<p class="annual">Billed monthly</p>';
      return `<article class="price-plan"><h3>${tier[0].toUpperCase() + tier.slice(1)}</h3><p class="price">$${prices.monthly}<span>/month</span></p>${annual}<a class="btn" href="${esc(values.appUrl)}" target="_top">Choose ${tier[0].toUpperCase() + tier.slice(1)}</a></article>`;
    }).join("");
    const rows = copy.rows
      .map((r) => `<article class="story-row reveal"><h3>${orb(r.color, 34, "hello")}${esc(r.title)}</h3><div><p>${esc(r.body)}</p></div></article>`)
      .join("");
    const colors = ["aurora", "ocean", "mint", "ember", "sun", "rose"];
    const faqs = copy.faqs
      .map((f, i) => `<details name="faq"><summary>${orb(colors[i % colors.length], 26)}<span class="q">${esc(f.q)}</span></summary><p>${esc(f.a)}</p></details>`)
      .join("");
    return template
      .replace("{{orbCss}}", `<style>${orbCss}</style>`)
      .replace("{{storyRows}}", rows)
      .replace("{{pricingRows}}", pricing)
      .replace("{{faqRows}}", faqs)
      .replace(/\{\{(\w+)\}\}/g, (_, k: string) => esc(values[k] ?? ""))
      .replace('<html lang="en">', `<html lang="${lang}" dir="${ar ? "rtl" : "ltr"}">`)
      .replace("</head>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600&amp;display=swap"></head>');
  }, [lang]);

  useEffect(() => {
    document.title = lang === "ar" ? "Ceyo — روبوتاتك الشخصية ومجموعاتك" : "Ceyo — Your Personal Bots and Group Chats";
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      if (e.data?.type !== "ceyo-landing-language") return;
      const next: LandingLang = lang === "ar" ? "en" : "ar";
      localStorage.setItem(LANG_KEY, next);
      setLang(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [lang]);

  return <iframe key={lang} ref={frame} title="Ceyo" srcDoc={html} style={{ display: "block", width: "100%", height: "100dvh", border: 0 }} />;
}
