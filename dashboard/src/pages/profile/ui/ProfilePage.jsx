import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  User2,
  UserCircle,
  Hash,
  Building2,
  IdCard,
  FileText,
  Phone,
  MapPin,
  Award,
} from 'lucide-react'
import { useAuth } from '@/features/auth'
import { ProfileHeader } from '@/widgets/profile-header'
import { ProfileFields, ProfileFieldRow } from '@/widgets/profile-fields'
import { PseudonymEdit } from '@/features/user-update-pseudonym'
import { PhonesEdit } from '@/features/user-update-phones'
import { AddressEditDialog } from '@/features/user-update-address'

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const { t } = useTranslation()
  const [editingKey, setEditingKey] = useState(null)
  const [addressOpen, setAddressOpen] = useState(false)

  if (!user) return null

  const isLegal = user.userType === 'LEGAL'

  const handleSaved = (updated) => {
    if (updated && typeof updated === 'object') {
      setUser({ ...user, ...updated })
    }
    setEditingKey(null)
  }

  const identityFields = isLegal
    ? [
        { label: t('profile.f_legal_name'), value: user.legalName, icon: Building2 },
        { label: t('profile.f_inn'), value: user.inn, icon: Hash, copyable: true },
      ]
    : [
        { label: t('profile.f_last_name'), value: user.lastName, icon: UserCircle },
        { label: t('profile.f_first_name'), value: user.firstName, icon: UserCircle },
        { label: t('profile.f_middle_name'), value: user.middleName, icon: User2 },
        {
          label: t('profile.f_pseudonym'),
          value: user.pseudonym || user.pseudoname,
          icon: UserCircle,
          key: 'pseudonym',
        },
        { label: t('profile.f_pinfl'), value: user.pinfl, icon: IdCard, copyable: true },
        { label: t('profile.f_passport'), value: user.passportSeria, icon: FileText, copyable: true },
      ]

  const contactFields = [
    { label: t('profile.f_phones'), value: user.phones?.join(', '), icon: Phone, key: 'phones' },
    { label: t('profile.f_address'), value: user.address, icon: MapPin, key: 'address' },
  ]

  const membershipFields = [
    { label: t('profile.f_membership'), value: user.isMember, icon: Award, isMember: true },
  ]

  const renderField = (f) => {
    const isEditing = editingKey === f.key && f.key && f.key !== 'address'
    let editSlot = null

    if (isEditing && f.key === 'pseudonym') {
      editSlot = (
        <PseudonymEdit
          initialValue={user.pseudonym || user.pseudoname}
          onDone={handleSaved}
          onCancel={() => setEditingKey(null)}
        />
      )
    } else if (isEditing && f.key === 'phones') {
      editSlot = (
        <PhonesEdit
          initialPhones={user.phones || []}
          onDone={handleSaved}
          onCancel={() => setEditingKey(null)}
        />
      )
    }

    return (
      <ProfileFieldRow
        key={f.label}
        icon={f.icon}
        label={f.label}
        value={f.value}
        editable={!!f.key}
        editing={isEditing}
        editSlot={editSlot}
        isMember={!!f.isMember}
        copyable={!!f.copyable}
        onEdit={() => {
          if (f.key === 'address') setAddressOpen(true)
          else setEditingKey(f.key)
        }}
      />
    )
  }

  return (
    <div className="flex max-w-[820px] flex-col gap-5">
      <ProfileHeader user={user} />

      <ProfileFields title={isLegal ? t('profile.section_identity_legal') : t('profile.section_identity')} icon={User2}>
        {identityFields.map(renderField)}
      </ProfileFields>

      <ProfileFields title={t('profile.section_contact')} icon={Phone}>
        {contactFields.map(renderField)}
      </ProfileFields>

      <ProfileFields title={t('profile.section_membership')} icon={Award}>
        {membershipFields.map(renderField)}
      </ProfileFields>

      <AddressEditDialog
        open={addressOpen}
        onOpenChange={setAddressOpen}
        initialAddress={user.address}
        onDone={handleSaved}
      />
    </div>
  )
}
