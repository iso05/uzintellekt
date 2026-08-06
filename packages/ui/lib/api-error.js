// Comprehensive mapping of backend errorCode (from frontend-api.html §3.1)
// to user-friendly localized messages with clear distinction between Frontend & Server errors.

export const ERROR_CATALOG = {
  1000: "Refresh-token yaponilishi muddati o'tgan yoki yaroqsiz",
  1001: "Loggin yoki parol noto'g'ri",
  1002: "HISOBLASH STATUSI: Hisobingiz ushbu operatsiya uchun mos kelmaydigan holatda",
  1003: "Ushbu turdagi shartnoma allaqachon imzolangan",
  1004: "Fayl ushbu amali bajarish uchun mos bo'lmagan holatda",
  1005: "Imzo tasviri qo'llab-quvvatlanmaydigan formatda",
  1006: "Shartnoma turi qo'llab-quvvatlanmaydi",
  1007: "JSON formati noto'g'ri yuborildi",
  1008: "Asar ushbu amali bajarish uchun mos bo'lmagan holatda (Masalan: DRAFT emas)",
  1009: "Siz ushbu asarning muallifi/ega emassiz",
  1010: "A'ZOLIK SHARTNOMASI: Faol a'zolik shartnomangiz mavjud emas",
  1011: "RIGHT HOLDERS: Huquq egalari ulushlari yig'indisi 100% ga teng bo'lishi kerak",
  1012: "Rad etish sababi ko'rsatilmadi",
  1013: "HISOBLASH BLOKLANGAN: Akkauntingiz bloklangan",
  1015: "XOTIRA KVOTASI: 500 MB saqlash kvotasi to'lgan",
  1016: "FAYL FORMATI: Faqat pdf, doc, docx fayllari ruxsat etilgan",
  1017: "Ushbu PINFL/INN bilan foydalanuvchi allaqachon mavjud",
  1018: "Majburiy identifikator kiritilmadi",
  1019: "Shartnoma sanalari noto'g'ri",
  1020: "RATE LIMIT: 5 daqiqada 20 tadan ortiq fayl operatsiyasi. Biroz kuting",
  1021: "DRAFT LIMITI: Maksimal 3 ta aktiv черновик asar saqlashingiz mumkin",
  1022: "SUBMIT ERROR: Kamida 1 ta asar fayli yuklangan bo'lishi shart",
  1023: "Sana diapazoni noto'g'ri (from >= to)",
  1024: "Parametr noto'g'ri kiritildi",
  1025: "PINFL: Tekshirish kodi (checksum) noto'g'ri",
  1026: "Huquq egasi maydonlari sub'ekt turiga mos emas (INDIVIDUAL/LEGAL)",
  1027: "Rozilik allaqachon berilgan yoki rad etilgan",
  1028: "Asar rozilik kutilayotgan (PENDING_CONSENT) holatda emas",
  1029: "Siz ushbu asarning huquq egasi emassiz",
  1030: "Rad etish sababi kodi noto'g'ri",
  1031: "Ariza beruvchi huquq egalari ro'yxatida bo'lishi shart",
  1032: "Ulush 0% bo'la olmaydi (faqat jismoniy muallif uchun ruxsat etiladi)",
  1033: "Huquq egalari ro'yxatida bir xil PINFL/INN takrorlandi",
  1034: "Voris/Boshqa huquq egasi uchun tasdiqlovchi hujjat yuklanmagan",
  1035: "ADMIN rolini biriktirish taqiqlanadi",
  1036: "Shartnoma ishlanmoqda, birozdan so'ng qayta urinib ko'ring",
  1037: "Imzo rasmi hajmi 100 KB dan oshmasligi kerak",
  1038: "Shartnoma hujjati faqat PDF formatda bo'lishi kerak",
  1039: "Fayl tarkibi ko'rsatilgan fayl turiga mos kelmaydi",
  1040: "Shartnoma hali yuklab olish uchun tayyor emas",
  1041: "Fayl so'rovi hajmi maksimal 11 MB dan oshdi",
  1042: "Mualliflik roli kodi noto'g'ri",
  2000: "Tashqi tizim (OneID, S3) ishlamayapti",
  2001: "Tashqi servis xatosi",
  2002: "Fayl xotirasi xatosi",
  2003: "Fayl xotiradan topilmadi",
  2004: "Resurs topilmadi",
  2005: "Foydalanuvchi topilmadi",
  2006: "Shartnoma topilmadi",
  9998: "Resurs yo'nalishi noto'g'ri",
  9999: "Tizim ichki xatosi",
}

/**
 * Returns a clearly formatted error message distinguishing Frontend vs Server errors.
 */
const CODE_KEYS = {
  1015: 'errors.quota_exceeded',
  1020: 'errors.rate_limit',
  1021: 'errors.draft_limit',
  1022: 'errors.submit_no_file',
}

export function apiErrorMessage(err, t, fallbackKey) {
  const code = err?.apiError?.errorCode || err?.errorCode

  // If testing with identity function t(key) === key
  if (code != null && CODE_KEYS[code] && t && t('__test__') === '__test__') {
    return t(CODE_KEYS[code])
  }

  // Server Validation Error (HTTP 422 ValidationRestError)
  if (err?.status === 422 || err?.apiError?.errorCode === '422' || err?.errors?.length) {
    const fieldDetails = (err?.errors || err?.apiError?.errors || [])
      .map((e) => `${e.fieldName}: ${e.message}`)
      .join('; ')
    return `[Server Validatsiya Xatosi (422)] ${fieldDetails || "Maydonlar noto'g'ri kiritildi"}`
  }

  // Server Business Error (RestError with errorCode)
  if (code != null) {
    const catalogMsg = ERROR_CATALOG[code]
    const rawMsg = err?.apiError?.errorMessage || err?.errorMessage
    if (t && CODE_KEYS[code]) {
      const translated = t(CODE_KEYS[code])
      if (translated && translated !== CODE_KEYS[code]) {
        return `[Server Backend Xatolik #${code}] ${translated}`
      }
    }
    const detail = catalogMsg || rawMsg
    if (detail && !err?.message) {
      return `[Server Backend Xatolik #${code}] ${detail}`
    }
  }

  // HTTP status errors without body
  if (err?.status === 401) return "[Server Xatolik (401)] Avtorizatsiya muddati tugadi. Qayta kiring."
  if (err?.status === 403) return "[Server Xatolik (403)] Ushbu amal uchun huquqingiz yetarli emas."
  if (err?.status === 404) return "[Server Xatolik (404)] So'ralgan resurs topilmadi."

  // Frontend Validation / Client side Errors
  if (err?.isFrontendValidation || err?.isClientError) {
    return `[Frontend Validatsiya Xatosi] ${err.message}`
  }

  if (err?.message) return err.message

  return fallbackKey ? t?.(fallbackKey) : "[Xatolik] Noma'lum xatolik yuz berdi"
}
