import { BODY, ENCODER, KEYS } from './keyboard/layout.js'
import { LAYER_DEFS } from './keyboard/layers.js'

export default function SceneFallback({ exploded = false }) {
  const scale = 40
  const px = (x) => 35 + (x + BODY.width / 2) * scale
  const pz = (z) => 30 + (z + BODY.depth / 2) * scale
  if (exploded) return (
    <div className="scene-fallback" aria-hidden="true">
      <svg className="fallback-exploded" viewBox="0 0 800 760" fill="none">
        {LAYER_DEFS.map((layer, index) => (
          <g key={layer.id} transform={'translate(190 ' + (35 + index * 100) + ')'}>
            <path d="M0 42 390 0l190 42-390 45Z" fill={['#353c43', '#3a3430', '#777c80', '#38352f', '#1e5745', '#8b9190', '#282d33'][index]} stroke="#7d8388" strokeWidth="1" />
            <path d="M0 42v12l190 45 390-45V42L190 87Z" fill="#1b1e22" stroke="#50575e" />
            {index === 0 && Array.from({ length: 12 }, (_, key) => (
              <path key={key} d={'M' + (30 + key * 31) + ' 45l22-3 103 24-22 3Z'} fill={key === 0 ? '#cb784b' : '#535b66'} />
            ))}
            {index === 4 && <path d="m80 36 180 42m-100-57 180 42M140 50l225-25M200 65l225-25" stroke="#b8ad78" strokeWidth="2" />}
            {index === 5 && <path d="m45 43 140-15 130 29-140 17Zm170-18 140-15 130 29-140 17Z" fill="#b4b4a8" stroke="#c69a61" />}
            <text x="555" y="85" fill="#a8acae" fontFamily="monospace" fontSize="12" textAnchor="end">{String(index + 1).padStart(2, '0')} / {layer.short}</text>
          </g>
        ))}
      </svg>
    </div>
  )
  return (
    <div className="scene-fallback" aria-hidden="true">
      <svg className="fallback-keyboard" viewBox="0 0 760 335" fill="none">
        <rect x="30" y="40" width="700" height="278" rx="15" fill="#111316" stroke="#35393f" />
        <rect x="30" y="27" width="700" height="278" rx="15" fill="#2c3036" stroke="#666c75" />
        <rect x="40" y="37" width="680" height="258" rx="9" fill="#121519" />
        {KEYS.map((item) => (
          <g key={item.id}>
            <rect x={px(item.x - item.w / 2)} y={pz(item.z - item.d / 2) + 3}
              width={item.w * scale} height={item.d * scale} rx="3" fill="#090b0d" />
            <rect x={px(item.x - item.w / 2)} y={pz(item.z - item.d / 2)}
              width={item.w * scale} height={item.d * scale} rx="3"
              fill={item.accent ? '#cb6d43' : '#30363e'} stroke={item.accent ? '#f59c70' : '#444b55'} strokeWidth="0.6" />
            <text x={px(item.x)} y={pz(item.z) + 3} textAnchor="middle"
              fontSize={item.label.length > 1 ? '6' : '10'} fontFamily="Arial, sans-serif"
              fill={item.accent ? '#251b14' : '#c5c7cb'}>{item.label}</text>
          </g>
        ))}
        <circle cx={px(ENCODER.x)} cy={pz(ENCODER.z)} r="16" fill="#262a30" stroke="#878b90" />
        <circle cx={px(ENCODER.x)} cy={pz(ENCODER.z)} r="12" stroke="#e78351" strokeWidth="1.5" />
        <path d="M340 311h80" stroke="#b66c46" strokeWidth="1.5" />
      </svg>
    </div>
  )
}
