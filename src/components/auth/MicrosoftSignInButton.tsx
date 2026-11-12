/** @doc Sign in with Microsoft button following Microsoft's identity branding (four-square logo). */
import { Button } from "@/components/ui/button";

export function MicrosoftSignInButton({ label, onClick, disabled = false, className = "" }: {
  label: string; onClick: () => void; disabled?: boolean; className?: string;
}) {
  return <Button variant="ghost" type="button" className={`ceyo-microsoft-signin ${className}`} onClick={onClick} disabled={disabled}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="20" height="20" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg><span>{label}</span>
  </Button>;
}
