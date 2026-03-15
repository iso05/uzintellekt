export const navConfig = [
  {
    label: 'Jamiyat haqida',
    children: [
      {
        label: 'Boshqaruv',
        children: [
          { label: 'Rahbariyat', path: '/about/leadership' },
          { label: 'Tuzilma', path: '/about/structure' },
          { label: 'Kuzatuv kengashi', path: '/about/board' },
        ],
      },
      { label: 'Biz haqimizda', path: '/about' },
      { label: 'Hamkorlar', path: '/about/partners' },
      {
        label: 'Hujjatlar',
        children: [
          { label: 'Nizomlar', file: '/docs/nizomlar.pdf' },
          { label: 'Qonunlar', file: '/docs/qonunlar.pdf' },
          { label: "Yo'riqnomalar", file: '/docs/yoriqnomalar.pdf' },
        ],
      },
    ],
  },
  {
    label: 'Xizmatlar',
    children: [
      { label: 'Umumiy Hizmatlar', path: '/services' },
      { label: 'Deponentlash', path: '/services/depositing' },
    ],
  },
  {
    label: 'Reestrlar',
    disabled: true,
    children: [
      { label: 'Asarlar reestri', path: '/registries/works' },
      { label: 'Mualliflar reestri', path: '/registries/authors' },
      { label: 'Shartnomalar', path: '/registries/contracts' },
      { label: 'Sertifikatlar', path: '/registries/certificates' },
    ],
  },
  { label: 'Yangiliklar', path: '/news' },
  { label: 'Kontaktlar', path: '/contact' },
]
