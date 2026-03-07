import { useNavigate } from 'react-router-dom'
import { BookOpen, Brain, FileText, Headphones, ClipboardList, ChevronRight } from 'lucide-react'
import TopBar from '../components/TopBar.jsx'
import { useApp } from '../context/AppContext.jsx'

const modes = [
  {
    id: 'flashcards',
    icon: BookOpen,
    label: 'Flashcards',
    description: 'Vocabulary with spaced repetition',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    path: '/practice/flashcards',
  },
  {
    id: 'grammar',
    icon: Brain,
    label: 'Grammar',
    description: 'Fill-in-the-blank exercises',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
    path: '/practice/grammar',
  },
  {
    id: 'reading',
    icon: FileText,
    label: 'Reading',
    description: 'Passages + comprehension questions',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
    path: '/practice/reading',
  },
  {
    id: 'listening',
    icon: Headphones,
    label: 'Listening',
    description: 'Audio dialogues + questions',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
    path: '/practice/listening',
  },
  {
    id: 'mock-exam',
    icon: ClipboardList,
    label: 'Mock Exam',
    description: 'Timed full B1 simulation',
    color: 'bg-red-50',
    iconColor: 'text-[#C60B1E]',
    path: '/practice/mock-exam',
  },
]

const SESSION_LENGTHS = [
  { value: '5-10', label: '5–10 min', sub: 'Quick review' },
  { value: '15-20', label: '15–20 min', sub: 'Standard' },
  { value: '30-45', label: '30–45 min', sub: 'Deep practice' },
]

export default function PracticePage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useApp()

  return (
    <div className="flex flex-col pb-24">
      <TopBar title="Practice" />

      <div className="px-4 max-w-lg mx-auto w-full space-y-5 pt-4">
        {/* Session length */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Session Length</h2>
          <div className="flex gap-2">
            {SESSION_LENGTHS.map(({ value, label, sub }) => (
              <button
                key={value}
                onClick={() => updateSettings({ sessionLength: value })}
                className={`flex-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                  settings.sessionLength === value
                    ? 'border-[#C60B1E] bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <p className={`text-sm font-semibold ${settings.sessionLength === value ? 'text-[#C60B1E]' : 'text-gray-700'}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400">{sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Practice modes */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Choose Mode</h2>
          <div className="space-y-2.5">
            {modes.map(({ id, icon: Icon, label, description, color, iconColor, path }) => (
              <button
                key={id}
                onClick={() => navigate(path)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 active:scale-99 transition-transform"
              >
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={iconColor} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
