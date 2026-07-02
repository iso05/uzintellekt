import { useTranslation } from 'react-i18next'
import { Building2, User, Check, FlaskConical } from 'lucide-react'
import { Badge } from '@shared/ui'

export default function UserBadges({ user }) {
  const { t } = useTranslation()
  if (!user) return null
  const isLegal = user.userType === 'LEGAL'
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        {isLegal ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {isLegal ? t('user.type_legal') : t('user.type_physical')}
      </Badge>

      {user.isMember && (
        <Badge variant="success" className="gap-1">
          <Check className="h-3 w-3" />
          {t('user.member')}
        </Badge>
      )}

      {user._isTestMode && (
        <Badge variant="warning" className="gap-1">
          <FlaskConical className="h-3 w-3" />
          {t('user.test_mode')}
        </Badge>
      )}
    </div>
  )
}
