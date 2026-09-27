interface Props {
  score: number
  targetGrade: string
  size?: 'sm' | 'md' | 'lg'
}

export default function ReadinessGauge({ score, targetGrade, size = 'md' }: Props) {
  const radius = size === 'lg' ? 54 : size === 'md' ? 44 : 34
  const stroke = size === 'lg' ? 8 : 6
  const cx = radius + stroke
  const cy = radius + stroke
  const svgSize = (radius + stroke) * 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 75 ? '#2d6a4f' : score >= 60 ? '#d4a017' : '#e11d48'
  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-2xl'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none" stroke="#e8f4f0" strokeWidth={stroke}
          />
          {/* Fill */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${textSize} font-extrabold text-[#1a3a2a]`}>{score}</span>
          <span className="text-xs text-gray-400 font-medium">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#1a3a2a] text-center">
        {targetGrade} Readiness
      </p>
    </div>
  )
}
