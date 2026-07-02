import { createI18n } from '@shared/i18n'

import uzCyrl from './uz-Cyrl.json'
import uz from './uz.json'
import ru from './ru.json'
import en from './en.json'

// App-local translations wired into the shared i18n setup.
export default createI18n({ 'uz-Cyrl': uzCyrl, uz, ru, en })
