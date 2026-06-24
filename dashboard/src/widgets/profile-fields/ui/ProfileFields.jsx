import { User2 } from 'lucide-react'

export default function ProfileFields({ children, title, icon: Icon = User2 }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4 md:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="m-0 text-[15px] font-bold leading-tight text-foreground">
          {title || "Shaxsiy ma'lumotlar"}
        </h2>
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}
