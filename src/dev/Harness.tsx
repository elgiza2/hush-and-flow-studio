import { MemoryRouter } from "react-router-dom";
import { CoinDetail } from "@/pages/wallet/MarketsView";
import TradePanel from "@/pages/wallet/TradePanel";
import { AgentForm } from "@/pages/agent/hub/HubPanels";
import "@/styles/app.css";
import "@/styles/wallet.css";
import "@/styles/onboarding.css";
export default function Harness() {
  const v = new URLSearchParams(location.search).get("v");
  return <MemoryRouter><div className="dark" style={{ minHeight: "100vh", background: "hsl(var(--background))" }}>
    {v === "coin" && <div className="wl" dir="ltr"><CoinDetail id="solana" balance={1.2} onBack={() => {}} onReceive={() => {}} onSend={() => {}} /></div>}
    {v === "trade" && <div className="wl" dir="ltr"><TradePanel target={{ network: "solana", token: "So11111111111111111111111111111111111111112", pay: "So11111111111111111111111111111111111111112", paySym: "SOL", label: "Solana", explorer: "https://solscan.io/tx/" } as never} symbol="BONK" side="buy" onClose={() => {}} /></div>}
    {v === "bot" && <div className="ob" dir="ltr"><main className="ob-main ob-bot"><h1>Create your main bot</h1><p className="ob-sub">Your main assistant.</p><AgentForm lang="en" title="" cta="Create" busy={false} error="" onSubmit={() => {}} onCancel={() => {}} /></main></div>}
  </div></MemoryRouter>;
}
