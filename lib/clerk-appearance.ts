// Tema compartido para los componentes de Clerk (sign-in, sign-up, UserButton…)
// ajustado a la identidad visual de Holidog Inn (ver CLAUDE.md §3).
// Se aplica globalmente vía `<ClerkProvider appearance={clerkAppearance}>`.

export const clerkAppearance = {
  variables: {
    colorPrimary: "#063F52", // brand.teal — acción primaria
    colorText: "#1A1A1A", // neutral.ink
    colorTextSecondary: "#6B6B6B", // neutral.muted
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#1A1A1A",
    colorDanger: "#C0392B",
    borderRadius: "0.65rem",
    fontFamily: "var(--font-sans)",
  },
  elements: {
    // Las clases usan los tokens de Tailwind definidos en app/globals.css.
    formButtonPrimary: "bg-brand-teal hover:bg-brand-teal/90 text-white",
    footerActionLink: "text-brand-mustard hover:text-brand-mustard/80",
    card: "border border-neutral-border shadow-sm",
    headerTitle: "text-brand-teal",
  },
};
