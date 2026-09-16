import { useLang } from '../../contexts/LangContext'

export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang()

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => setLang('en')}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          lang === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {compact ? 'EN' : t.english}
      </button>
      <button
        onClick={() => setLang('am')}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          lang === 'am' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        {compact ? 'አማ' : t.amharic}
      </button>
    </div>
  )
}
