export const navConfig = [
  {
    key: 'nav.about_society',
    label: 'Jamiyat haqida',
    children: [
      {
        key: 'nav.management',
        label: 'Boshqaruv',
        children: [
          { key: 'nav.leadership', label: 'Rahbariyat', path: '/about/leadership' },
          { key: 'nav.structure', label: 'Tuzilma', path: '/about/structure' },
          { key: 'nav.board', label: 'Kuzatuv kengashi', path: '/about/board' },
        ],
      },
      { key: 'nav.about_us', label: 'Biz haqimizda', path: '/about' },
      { key: 'nav.partners', label: 'Hamkorlar', path: '/about/partners' },
      {
        key: 'nav.docs',
        label: 'Hujjatlar',
        disabled: true,
        children: [
          // { label: 'Nizomlar', path: '/docs/nizomlar' },
          // { label: 'Qonunlar', path: '/docs/qonunlar' },
          // { label: "Yo'riqnomalar", path: '/docs/yoriqnomalar' },
        ],
      },
    ],
  },
  {
    key: 'nav.services',
    label: 'Xizmatlar',
    children: [
      { key: 'nav.general_services', label: 'Umumiy Hizmatlar', path: '/services' },
      { key: 'nav.depositing', label: 'Deponentlash', path: '/services/depositing' },
    ],
  },
  {
    key: 'nav.registries',
    label: 'Reestrlar',
    disabled: true,
    children: [
      { key: 'nav.works_registry', label: 'Asarlar reestri', path: '/registries/works' },
      { key: 'nav.authors_registry', label: 'Mualliflar reestri', path: '/registries/authors' },
      { key: 'nav.contracts', label: 'Shartnomalar', path: '/registries/contracts' },
      { key: 'nav.certificates', label: 'Sertifikatlar', path: '/registries/certificates' },
    ],
  },
  { key: 'nav.news', label: 'Yangiliklar', path: '/news' },
  { key: 'nav.contacts', label: 'Kontaktlar', path: '/contact' },
]
