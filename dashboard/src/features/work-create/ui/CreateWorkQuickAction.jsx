import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card } from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'

export default function CreateWorkQuickAction() {
  const navigate = useNavigate()
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(ROUTES.WORK_NEW)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(ROUTES.WORK_NEW)
        }
      }}
      className="cursor-pointer border-t-[3px] border-t-success p-4 transition-shadow hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <Plus className="h-5 w-5 text-success" />
        <span className="text-[15px] font-bold text-foreground">Yangi asar qo'shish</span>
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Yangi intellektual mulk asarini ro'yxatdan o'tkazish uchun ariza yuborish.
      </p>
    </Card>
  )
}
