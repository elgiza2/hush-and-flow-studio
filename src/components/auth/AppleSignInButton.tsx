/** @doc Sign in with Apple button drawn to Apple's guidelines with Apple's official logo artwork. */
import { Button } from "@/components/ui/button";
import appleLogoWhite from "@/assets/auth/apple-logo-white.svg";
import appleLogoBlack from "@/assets/auth/apple-logo-black.svg";

/** Apple requires one of its approved titles; keep it identical everywhere in the app. */
export const APPLE_SIGN_IN_TITLE = "Continue with Apple";

/** `white` sits on dark backgrounds (the sign-in screens are always dark); `black` on light ones. */
export function AppleSignInButton({ onClick, disabled = false, tone = "white", className = "" }: {
  onClick: () => void; disabled?: boolean; tone?: "white" | "black"; className?: string;
}) {
  // White button uses the black logo artwork and vice versa; the artwork carries its own padding.
  const logo = tone === "white" ? appleLogoBlack : appleLogoWhite;
  return <Button variant="ghost" type="button" className={`ceyo-apple-signin ceyo-apple-signin--${tone} ${className}`} onClick={onClick} disabled={disabled}>
    <img src={logo} alt="" aria-hidden="true" draggable={false} />
    <span>{APPLE_SIGN_IN_TITLE}</span>
  </Button>;
}

export default AppleSignInButton;
