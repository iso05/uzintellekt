import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles, Calendar } from 'lucide-react'
import { Button } from '@/shared/ui'
import { getUserShortName, getUserRoleLabel } from '@/entities/user'
import { todayLocalized } from '@/shared/lib/format'
import { ROUTES } from '@/shared/config/routes'

export default function WelcomeCard({ user }) {
  const navigate = useNavigate()
  const name = getUserShortName(user)
  const role = getUserRoleLabel(user)

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary via-primary to-[hsl(217_76%_35%)] p-6 text-primary-foreground shadow-soft-md md:p-8">
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-2xl" aria-hidden />
      <div className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-accent/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-2xl flex-col gap-2.5">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="h-3 w-3" />
            {role}
          </span>
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight md:text-3xl">
            Xush kelibsiz, {name}!
          </h1>
          <p className="text-[14px] leading-relaxed text-white/85 md:text-[15px]">
            Bu yerda siz o&apos;z asarlaringizni ro&apos;yxatdan o&apos;tkazasiz va ariza holatini kuzatib borasiz.
          </p>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/75">
            <Calendar className="h-3.5 w-3.5" />
            {todayLocalized()}
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => navigate(ROUTES.WORK_NEW)}
          className="h-12 shrink-0 gap-2 bg-white px-6 text-primary shadow-soft-md hover:bg-white/95 hover:text-primary"
        >
          <Plus className="h-5 w-5" />
          Yangi asar qo&apos;shish
        </Button>
      </div>
    </section>
  )
}
