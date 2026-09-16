import { useLang } from '../../contexts/LangContext'

export default function LangSwitcherSidebar() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs text-gray-400 mr-1">🌐</span>
      <button
        onClick={() => setLang('en')}
        className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${
          lang === 'en' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'
        }`}
      >EN</button>
      <button
        onClick={() => setLang('am')}
        className={`text-xs px-2 py-1 rounded-lg font-semibold transition-all ${
          lang === 'am' ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:text-gray-600'
        }`}
      >አማ</button>
    </div>
  )
}
