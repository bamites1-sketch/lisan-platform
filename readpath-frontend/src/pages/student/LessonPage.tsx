import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentLayout from '../../components/layout/StudentLayout'

type Step = 'explanation' | 'example' | 'guided' | 'practice' | 'complete'

const LESSON = {
  title: 'Using Context Clues',
  skillArea: 'VOCABULARY',
  emoji: '📚',
  steps: [
    {
      id: 'explanation' as Step,
      label: 'Learn',
      content: {
        heading: 'What are context clues?',
        body: `When you come across a word you don't know, you don't always need a dictionary! The words and sentences **around** the unfamiliar word often give you clues about its meaning. These are called **context clues**.`,
        tips: [
          'Look for defining phrases right after the word (often introduced by "means," "is," or a dash)',
          'Look for examples that show the word\'s meaning',
          'Look for contrast — words like "but" or "however" often signal an opposite meaning',
        ]
      }
    },
    {
      id: 'example' as Step,
      label: 'Example',
      content: {
        sentence: '"The abandoned house was dilapidated — its roof was caving in, windows were broken, and weeds had taken over the yard."',
        word: 'dilapidated',
        explanation: 'The description after the dash (caving roof, broken windows, weeds) tells us exactly what "dilapidated" looks like. So it means in bad condition or falling apart.',
        clue: 'Look for the description after the dash — it explains the word for you!'
      }
    },
    {
      id: 'guided' as Step,
      label: 'Guided Practice',
      content: {
        sentence: '"She was so famished after the long hike that she ate three sandwiches immediately."',
        word: 'famished',
        hints: [
          'What is the person doing after the hike? What does eating three sandwiches immediately tell you?',
          'Think about how you feel after a long walk in the sun. What word describes that feeling?',
          'The word "famished" is similar to "hungry" — but much more intense.'
        ],
        answer: 'very hungry / starving'
      }
    },
    {
      id: 'practice' as Step,
      label: 'Practice',
      content: {
        sentence: '"The children were apprehensive about crossing the bridge because it looked old and shaky."',
        word: 'apprehensive',
        options: ['excited', 'worried or fearful', 'happy', 'bored'],
        correct: 'worried or fearful',
        explanation: '"Old and shaky" tells us the bridge seems dangerous — so "apprehensive" means worried or fearful.'
      }
    }
  ]
}

export default function LessonPage() {
  const [stepIdx, setStepIdx] = useState(0)
  const [hintLevel, setHintLevel] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [complete, setComplete] = useState(false)

  const step = LESSON.steps[stepIdx]
  const isLast = stepIdx === LESSON.steps.length - 1

  const handleNext = () => {
    if (isLast) { setComplete(true); return }
    setStepIdx(i => i + 1)
    setHintLevel(0)
    setSelected(null)
    setConfirmed(false)
  }

  if (complete) return (
    <StudentLayout>
      <div className="max-w-xl mx-auto animate-in">
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Complete!</h1>
          <p className="text-gray-500 mb-2">You just learned how to use context clues to understand unfamiliar words.</p>
          <div className="inline-block bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl mb-6">
            <span className="text-amber-800 font-bold">+25 XP earned ⚡</span>
          </div>
          <p className="text-sm text-gray-600 mb-6 px-4">
            <strong>Remember:</strong> Next time you see an unfamiliar word, look at the sentences around it before you reach for a dictionary. You might already have the clue you need!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/student/practice/vocabulary" className="btn-primary">Practice Now →</Link>
            <Link to="/student/plan" className="btn-secondary">Back to Plan</Link>
          </div>
        </div>
      </div>
    </StudentLayout>
  )

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto animate-in">
        {/* Header */}
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{LESSON.emoji}</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{LESSON.title}</p>
                <p className="text-xs text-gray-400">Vocabulary · Grade 6</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">Step {stepIdx + 1} of {LESSON.steps.length}</span>
          </div>
          <div className="flex gap-1">
            {LESSON.steps.map((s, i) => (
              <div key={s.id} className={`h-1.5 flex-1 rounded-full transition-all ${
                i < stepIdx ? 'bg-success-400' : i === stepIdx ? 'bg-brand-500' : 'bg-gray-100'
              }`} />
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {LESSON.steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => i < stepIdx && setStepIdx(i)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  i === stepIdx ? 'bg-brand-600 text-white' :
                  i < stepIdx ? 'bg-success-100 text-success-700 cursor-pointer' :
                  'bg-gray-100 text-gray-400 cursor-default'
                }`}
              >{s.label}</button>
            ))}
          </div>
        </div>

        <div className="card">
          {/* Step 1: Explanation */}
          {step.id === 'explanation' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">{(step.content as { heading: string; body: string; tips: string[] }).heading}</h2>
              <p className="text-gray-700 leading-relaxed">
                {(step.content as { heading: string; body: string; tips: string[] }).body.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </p>
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl">
                <p className="text-sm font-semibold text-brand-900 mb-2">💡 Tips for using context clues:</p>
                <ul className="space-y-1.5">
                  {(step.content as { tips: string[] }).tips.map((t, i) => (
                    <li key={i} className="text-sm text-brand-800 flex items-start gap-2">
                      <span className="text-brand-400 mt-0.5">→</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Example */}
          {step.id === 'example' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Let's look at an example</h2>
              <div className="p-4 bg-gray-50 border-l-4 border-brand-400 rounded-r-xl">
                <p className="text-gray-800 leading-relaxed italic text-base">{(step.content as { sentence: string }).sentence}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xl">🔍</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Unfamiliar word: <em>{(step.content as { word: string }).word}</em></p>
                  <p className="text-sm text-amber-800 mt-0.5">{(step.content as { clue: string }).clue}</p>
                </div>
              </div>
              <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
                <p className="text-sm font-semibold text-success-900 mb-1">✅ What it means:</p>
                <p className="text-sm text-success-800">{(step.content as { explanation: string }).explanation}</p>
              </div>
            </div>
          )}

          {/* Step 3: Guided Practice */}
          {step.id === 'guided' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Now you try — with some help</h2>
              <div className="p-4 bg-gray-50 border-l-4 border-brand-400 rounded-r-xl">
                <p className="text-gray-800 italic leading-relaxed">{(step.content as { sentence: string }).sentence}</p>
              </div>
              <p className="text-gray-700 font-medium">
                What does <strong><em>{(step.content as { word: string }).word}</em></strong> mean in this sentence?
              </p>

              {hintLevel === 0 ? (
                <button onClick={() => setHintLevel(1)} className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1.5 font-medium">
                  <span>💡</span> I need a hint
                </button>
              ) : (
                <div className="space-y-2">
                  {(step.content as { hints: string[] }).hints.slice(0, hintLevel).map((h, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900">
                      <p><strong>Hint {i + 1}:</strong> {h}</p>
                    </div>
                  ))}
                  {hintLevel < (step.content as { hints: string[] }).hints.length && (
                    <button onClick={() => setHintLevel(l => l + 1)} className="text-xs text-amber-600 underline">
                      Need another hint?
                    </button>
                  )}
                </div>
              )}

              <div className="p-4 bg-success-50 border border-success-200 rounded-xl">
                <p className="text-sm font-semibold text-success-900 mb-1">✅ Answer:</p>
                <p className="text-sm text-success-800">{(step.content as { answer: string }).answer}</p>
              </div>
            </div>
          )}

          {/* Step 4: Independent Practice */}
          {step.id === 'practice' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Now you're on your own!</h2>
              <div className="p-4 bg-gray-50 border-l-4 border-brand-400 rounded-r-xl">
                <p className="text-gray-800 italic leading-relaxed">{(step.content as { sentence: string }).sentence}</p>
              </div>
              <p className="font-medium text-gray-800">
                What does <strong><em>{(step.content as { word: string }).word}</em></strong> mean?
              </p>
              <div className="space-y-2.5">
                {(step.content as { options: string[] }).options.map(opt => {
                  let style = 'border-gray-200 hover:border-brand-400 hover:bg-brand-50 text-gray-700'
                  if (confirmed) {
                    if (opt === (step.content as { correct: string }).correct) style = 'border-success-400 bg-success-50 text-success-800'
                    else if (opt === selected) style = 'border-danger-400 bg-danger-50 text-danger-700'
                    else style = 'border-gray-100 bg-gray-50 text-gray-400'
                  } else if (opt === selected) {
                    style = 'border-brand-500 bg-brand-50 text-brand-800'
                  }
                  return (
                    <button key={opt} onClick={() => !confirmed && setSelected(opt)} disabled={confirmed}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${style}`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {confirmed && (
                <div className={`p-4 rounded-xl text-sm animate-in ${
                  selected === (step.content as { correct: string }).correct
                    ? 'bg-success-50 border border-success-200 text-success-800'
                    : 'bg-danger-50 border border-danger-200 text-danger-800'
                }`}>
                  <p className="font-semibold mb-1">
                    {selected === (step.content as { correct: string }).correct ? '✅ Correct!' : '❌ Not quite.'}
                  </p>
                  <p>{(step.content as { explanation: string }).explanation}</p>
                </div>
              )}
              {!confirmed && (
                <button onClick={() => { if (selected) setConfirmed(true) }} disabled={!selected}
                  className="btn-primary w-full disabled:opacity-40">
                  Check Answer
                </button>
              )}
            </div>
          )}

          {/* Next button */}
          {(step.id !== 'practice' || confirmed) && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button onClick={handleNext} className="btn-primary w-full">
                {isLast ? 'Complete Lesson 🎉' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  )
}
