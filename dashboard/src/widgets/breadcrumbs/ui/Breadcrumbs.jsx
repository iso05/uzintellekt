import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items }) {
  if (!items?.length) return null
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-1 text-[13px] font-medium text-muted-foreground"
    >
      {items.map((c, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={`${c.to}:${i}`}>
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            )}
            {last ? (
              <span className="font-semibold text-foreground">{c.label}</span>
            ) : (
              <Link to={c.to} className="rounded px-1 transition-colors hover:text-primary">
                {c.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
