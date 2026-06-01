export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-brand-teal">
          holidog <span className="italic text-brand-mustard">inn</span>
        </h1>
        <p className="mt-2 text-sm text-neutral-muted">Administración del hotel para perros</p>
      </div>
      {children}
    </main>
  );
}
