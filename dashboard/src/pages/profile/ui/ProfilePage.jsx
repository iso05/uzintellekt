import { useState } from 'react'
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
        { label: 'Tashkilot nomi', value: user.legalName, icon: Building2 },
        { label: 'INN', value: user.inn, icon: Hash, copyable: true },
      ]
    : [
        { label: 'Familiya', value: user.lastName, icon: UserCircle },
        { label: 'Ism', value: user.firstName, icon: UserCircle },
        { label: 'Otasining ismi', value: user.middleName, icon: User2 },
        {
          label: 'Tahallus',
          value: user.pseudonym || user.pseudoname,
          icon: UserCircle,
          key: 'pseudonym',
        },
        { label: 'PINFL', value: user.pinfl, icon: IdCard, copyable: true },
        { label: 'Pasport', value: user.passportSeria, icon: FileText, copyable: true },
      ]

  const contactFields = [
    { label: 'Telefon(lar)', value: user.phones?.join(', '), icon: Phone, key: 'phones' },
    { label: 'Manzil', value: user.address, icon: MapPin, key: 'address' },
  ]

  const membershipFields = [
    { label: "A'zolik holati", value: user.isMember, icon: Award, isMember: true },
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

      <ProfileFields title={isLegal ? "Tashkilot ma'lumotlari" : "Shaxsiy ma'lumotlar"} icon={User2}>
        {identityFields.map(renderField)}
      </ProfileFields>

      <ProfileFields title="Aloqa ma'lumotlari" icon={Phone}>
        {contactFields.map(renderField)}
      </ProfileFields>

      <ProfileFields title="A'zolik" icon={Award}>
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
