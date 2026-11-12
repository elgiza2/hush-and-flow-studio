import { Html, Head, Preview, Body, Container, Heading, Text, Link, Hr, Img } from "@react-email/components";
const theme = { paper: "#ffffff", ink: "#202020", muted: "#707070", soft: "#f4f4f4", line: "#e7e7e7" };
export function CeyoMessage({ name = "", title = "Welcome to Ceyo", message = "Your workspace is ready. Build your first team of bots and choose a plan to start working on your next project.", actionUrl = "https://web.ceyo.si", actionLabel = "Open Ceyo" }: { name?: string; title?: string; message?: string; actionUrl?: string; actionLabel?: string }) {
  const safeUrl = /^https:\/\/(web\.ceyo\.si|ceyo\.si)(\/|$)/.test(actionUrl) ? actionUrl : "https://web.ceyo.si";
  return <Html lang="en"><Head /><Preview>{title}</Preview><Body style={{ backgroundColor: theme.soft, color: theme.ink, fontFamily: "Arial, sans-serif", margin: 0 }}><Container style={{ maxWidth: 560, margin: "32px auto", padding: "36px 28px", backgroundColor: theme.paper }}>
    <Heading style={{ fontSize: 30, margin: "0 0 24px", fontWeight: 500 }}>Ceyo</Heading>
    <Img src="https://ceyo.si/email/hero-poster.jpg" alt="Ceyo" width="504" style={{ width: "100%", height: "auto", borderRadius: 8 }} />
    <Heading as="h2" style={{ fontSize: 26, lineHeight: "1.3", fontWeight: 500 }}>{title}</Heading>
    {name && <Text>Hello {name},</Text>}<Text style={{ fontSize: 16, lineHeight: "1.7", color: theme.muted }}>{message}</Text>
    <Link href={safeUrl} style={{ display: "inline-block", padding: "14px 22px", borderRadius: 8, backgroundColor: theme.ink, color: theme.paper, textDecoration: "none" }}>{actionLabel}</Link>
    <Hr style={{ borderColor: theme.line, margin: "32px 0 20px" }} /><Text style={{ fontSize: 12, lineHeight: "1.6", color: theme.muted }}>Ceyo · Megsy LLC<br />This is an account notification, not a marketing email.<br /><Link href="https://ceyo.si/privacy">Privacy</Link> · <Link href="https://ceyo.si/contact">Contact</Link></Text>
  </Container></Body></Html>;
}
