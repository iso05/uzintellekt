import { Mail, Phone } from 'lucide-react'
import { UserAvatar, UserBadges, getUserFullName } from '@/entities/user'

export default function ProfileHeader({ user }) {
  const fullName = getUserFullName(user) || '—'
  const phone = user?.phones?.[0]
  const email = user?.email

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:gap-5 md:p-6">
      <div className="shrink-0">
        <UserAvatar user={user} size="lg" className="!rounded-xl !h-16 !w-16 !text-xl sm:!h-20 sm:!w-20 sm:!text-2xl" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h1 className="m-0 break-words text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
          {fullName}
        </h1>
        <UserBadges user={user} />
        {(phone || email) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            {phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </span>
            )}
            {email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
