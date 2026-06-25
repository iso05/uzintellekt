// Latin Uzbek → Cyrillic Uzbek transliteration.
//
// The backend dictionaries (work types, author roles) ship only uz/ru/en —
// there is no Cyrillic value — so for the default Uzbek-Cyrillic UI we
// transliterate the Latin `uz` string on the client. Native words convert
// cleanly; a few Russian loanwords (e.g. "Ssenariy") come out phonetically
// rather than in their conventional Cyrillic spelling, which is an accepted
// trade-off for full coverage of the default language.

// Normalise the various apostrophe glyphs used for oʻ/gʻ and the tutuq belgisi.
const APOSTROPHES = /[ʻʼ‘’`´ʹ']/g

// Multi-char sequences, checked before single letters. o' / g' are letter +
// apostrophe (already normalised to ').
const DIGRAPHS = [
  ["o'", 'ў'],
  ["g'", 'ғ'],
  ['sh', 'ш'],
  ['ch', 'ч'],
  ['yo', 'ё'],
  ['yu', 'ю'],
  ['ya', 'я'],
  ['ye', 'е'],
  ['ts', 'ц'],
]

const SINGLES = {
  a: 'а', b: 'б', c: 'ц', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и', j: 'ж',
  k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'қ', r: 'р', s: 'с',
  t: 'т', u: 'у', v: 'в', w: 'в', x: 'х', y: 'й', z: 'з', "'": 'ъ',
}

const isUpper = (ch) => ch !== ch.toLowerCase() && ch === ch.toUpperCase()
const isLetterLike = (ch) => /[a-zа-яёўғқҳ'Ѐ-ӿ]/i.test(ch)

function applyCase(cyr, source) {
  if (!source) return cyr
  if (source.length > 1 && isUpper(source[0]) && isUpper(source[source.length - 1])) {
    return cyr.toUpperCase()
  }
  if (isUpper(source[0])) {
    return cyr.charAt(0).toUpperCase() + cyr.slice(1)
  }
  return cyr
}

export function transliterateUzLatinToCyrillic(input) {
  if (!input) return input
  const s = input.replace(APOSTROPHES, "'")
  let out = ''
  let i = 0
  while (i < s.length) {
    const two = s.slice(i, i + 2)
    const dig = DIGRAPHS.find(([k]) => k === two.toLowerCase())
    if (dig) {
      out += applyCase(dig[1], two)
      i += 2
      continue
    }
    const ch = s[i]
    const lower = ch.toLowerCase()
    let cyr
    if (lower === 'e') {
      // Word-initial e → э, otherwise е.
      const prev = i > 0 ? s[i - 1] : ''
      cyr = !prev || !isLetterLike(prev) ? 'э' : 'е'
    } else if (lower in SINGLES) {
      cyr = SINGLES[lower]
    } else {
      out += ch // digits, spaces, punctuation, already-Cyrillic
      i += 1
      continue
    }
    out += applyCase(cyr, ch)
    i += 1
  }
  return out
}
