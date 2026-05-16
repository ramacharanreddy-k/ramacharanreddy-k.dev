export function Footer() {
  return (
    <footer className="border-border border-t px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm">
          © {new Date().getFullYear()} Ramacharan Reddy Kasireddy
        </p>
        <p className="text-muted font-mono text-xs tracking-wide uppercase">
          Built with React · Vite · Tailwind
        </p>
      </div>
    </footer>
  )
}
