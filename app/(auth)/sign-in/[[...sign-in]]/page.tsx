import { SignIn } from "@clerk/nextjs";

// El branding (colores teal/mustard) se hereda del `appearance` global definido
// en <ClerkProvider> (lib/clerk-appearance.ts).
export default function SignInPage() {
  return <SignIn />;
}
