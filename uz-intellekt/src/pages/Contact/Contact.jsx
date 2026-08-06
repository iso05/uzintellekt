import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import emailjs from '@emailjs/browser'
import { Clock, Info, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react'
import { Button, Card, CardContent, Input, Label, Textarea } from '@/shared/ui'
import { useSEO } from '@/hooks/useSEO'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const EMAILJS_CONFIGURED = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY
)

const INITIAL = { from_name: '', from_email: '', message: '' }

const Contact = () => {
  const { t } = useTranslation()
  useSEO({
    title: t('seo.contact_title'),
    description: t('seo.contact_desc'),
  })
  const formRef = useRef()
  const [form, setForm] = useState(INITIAL)
  const [status, setStatus] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (status) setStatus(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!EMAILJS_CONFIGURED) return
    setStatus('loading')
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBLIC_KEY
      )
      setStatus('success')
      setForm(INITIAL)
    } catch {
      setStatus('error')
    }
  }

  const mailtoHref = `mailto:patentlextashkent@gmail.com?subject=${encodeURIComponent(
    'UzIntellekt — aloqa formasi'
  )}&body=${encodeURIComponent(
    `Ismi: ${form.from_name}\nEmail: ${form.from_email}\n\n${form.message}`
  )}`

  const InfoTile = ({ icon: Icon, title, value, href }) => {
    const Wrapper = href ? 'a' : 'div'
    const wrapperProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}
    return (
      <Wrapper {...wrapperProps} className="group flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
      </Wrapper>
    )
  }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {t('contact_page.title', "Biz bilan bog'laning")}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t(
              'contact_page.subtitle',
              'Savollaringiz bormi yoki hamkorlik qilmoqchimisiz? Biz sizni eshitishga tayyormiz.'
            )}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <InfoTile
              icon={MapPin}
              title={t('contact_page.address', 'Manzil')}
              value={t('footer.address', "Toshkent shahri, O'zbekiston")}
              href="https://maps.google.com/?q=Toshkent,O'zbekiston"
            />
            <InfoTile
              icon={Phone}
              title={t('contact_page.phone', 'Telefon')}
              value="+998 (88) 147-00-81"
              href="tel:+998881470081"
            />
            <InfoTile
              icon={Mail}
              title={t('contact_page.email', 'Email')}
              value="patentlextashkent@gmail.com"
              href="mailto:patentlextashkent@gmail.com"
            />
            <InfoTile
              icon={Clock}
              title={t('contact_page.hours', 'Ish vaqti')}
              value={t('contact_page.hours_val', 'Dushanba – Juma, 9:00 – 18:00')}
            />

            <div className="mt-2 overflow-hidden rounded-lg border border-border shadow-soft">
              <iframe
                title="UzIntellekt manzil"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d191857.51866833637!2d69.1393703!3d41.2994958!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b0cc379e9c3%3A0xa5a9323b4aa5cb98!2sTashkent%2C%20Uzbekistan!5e0!3m2!1sen!2sus!4v1700000000000"
                width="100%"
                height="260"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-foreground">
                {t('contact_page.send_message', 'Xabar yuborish')}
              </h2>

              {!EMAILJS_CONFIGURED && (
                <div className="mt-5 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <span>
                    {t(
                      'contact_page.unconfigured_notice',
                      "Forma hozircha sozlanmagan. Iltimos, pastdagi 'Mail orqali yuborish' tugmasini bosing."
                    )}
                  </span>
                </div>
              )}

              {status === 'success' && (
                <div className="mt-5 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                  {t(
                    'contact_page.success_msg',
                    'Xabaringiz muvaffaqiyatli yuborildi! Tez orada javob beramiz.'
                  )}
                </div>
              )}

              {status === 'error' && (
                <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {t(
                    'contact_page.error_msg',
                    "Xatolik yuz berdi. Iltimos qayta urinib ko'ring."
                  )}
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="from_name">
                    {t('contact_page.name_label', 'Ismingiz')}
                  </Label>
                  <Input
                    id="from_name"
                    name="from_name"
                    value={form.from_name}
                    onChange={handleChange}
                    placeholder={t('contact_page.name_placeholder', 'Ismingizni kiriting')}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="from_email">{t('contact_page.email', 'Email')}</Label>
                  <Input
                    id="from_email"
                    type="email"
                    name="from_email"
                    value={form.from_email}
                    onChange={handleChange}
                    placeholder={t('contact_page.email_placeholder', 'example@mail.com')}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    {t('contact_page.message_label', 'Xabar')}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    placeholder={t(
                      'contact_page.message_placeholder',
                      'Xabaringizni yozing...'
                    )}
                    required
                  />
                </div>

                {EMAILJS_CONFIGURED ? (
                  <Button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full"
                    size="lg"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('contact_page.sending_btn', 'Yuborilmoqda...')}
                      </>
                    ) : (
                      <>
                        {t('contact_page.send_btn', 'Yuborish')}
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full">
                    <a href={mailtoHref}>
                      <Mail className="h-4 w-4" />
                      {t('contact_page.send_mailto_btn', 'Mail orqali yuborish')}
                    </a>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default Contact
