import { useEffect, useMemo, useRef, useState } from "react";

const baseCss = `*{box-sizing:border-box}body{margin:0;padding:16px;background:var(--paper);color:var(--ink);font:14px/1.6 system-ui,sans-serif;overflow-wrap:anywhere}h1,h2,h3,p{margin:0 0 12px}h1{font-size:24px}h2{font-size:20px}h3{font-size:16px}.stack{display:grid;gap:12px}.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));gap:12px}.stat{padding:12px;background:var(--soft);border-radius:6px}.stat b,.stat span{display:block}.stat b{font-size:24px}.muted,.stat span{color:var(--muted)}.badge{padding:3px 8px;background:var(--soft);border-radius:4px}.bar{background:var(--soft);height:12px;overflow:hidden;border-radius:4px}.bar i{display:block;height:100%;background:var(--accent)}table{width:100%;border-collapse:collapse;display:block;overflow-x:auto}th,td{padding:10px;text-align:start;border-bottom:1px solid var(--line)}th{background:var(--soft)}button,input,select,textarea{font:inherit;color:inherit;border:1px solid var(--line);border-radius:6px;padding:8px 12px;background:var(--paper);max-width:100%}button{cursor:pointer}.primary{background:var(--accent);color:var(--on-accent)}svg,canvas,img{max-width:100%;height:auto}a{color:var(--accent)}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}`;

export default function VisualWidget({ html, onSend }: { html: string; onSend?: (text: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  const document = useMemo(() => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><style>:root{--ink:CanvasText;--paper:Canvas;--muted:GrayText;--line:GrayText;--soft:Canvas;--accent:Highlight;--on-accent:HighlightText}${baseCss}</style></head><body>${html}<script>(function(){function send(text){if(typeof text==='string'&&text.trim()&&text.length<=4000)parent.postMessage({type:'ceyo-widget-send',text:text},'*')}window.megsy={send:send};document.addEventListener('click',function(e){var el=e.target.closest('[data-send]');if(el){e.preventDefault();send(el.dataset.send)}});document.addEventListener('submit',function(e){e.preventDefault()});function resize(){parent.postMessage({type:'ceyo-widget-size',height:document.documentElement.scrollHeight},'*')}new ResizeObserver(resize).observe(document.body);resize();addEventListener('message',function(e){if(e.source!==parent||e.data.type!=='ceyo-widget-theme')return;Object.entries(e.data.tokens).forEach(function(t){document.documentElement.style.setProperty(t[0],t[1])})})})();</script></body></html>`, [html]);

  const syncTheme = () => {
    const el = frame.current;
    if (!el) return;
    const styles = getComputedStyle(el);
    const tokens: Record<string, string> = {};
    for (const [key, token] of Object.entries({ "--ink": "--cv-ink", "--paper": "--cv-panel", "--muted": "--cv-muted", "--line": "--cv-line", "--soft": "--cv-pricing-panel", "--accent": "--primary", "--on-accent": "--primary-foreground" })) {
      const value = styles.getPropertyValue(token).trim();
      if (value) {
        // Resolve oklch/var() expressions to a standalone color before crossing frames.
        const probe = window.document.createElement("span");
        probe.style.color = value;
        el.parentElement?.append(probe);
        tokens[key] = getComputedStyle(probe).color;
        probe.remove();
      }
    }
    el.contentWindow?.postMessage({ type: "ceyo-widget-theme", tokens }, "*");
  };

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !event.data || typeof event.data !== "object") return;
      if (event.data.type === "ceyo-widget-size" && typeof event.data.height === "number" && Number.isFinite(event.data.height)) setHeight(Math.max(120, Math.min(10000, event.data.height)));
      if (event.data.type === "ceyo-widget-send" && typeof event.data.text === "string" && event.data.text.trim() && event.data.text.length <= 4000) onSend?.(event.data.text);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSend]);

  return <iframe ref={frame} className="cx-visual-widget" title="Interactive answer" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={document} height={height} onLoad={syncTheme} />;
}