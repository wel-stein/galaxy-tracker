// Bottom navigation between the three tools.
const TABS = [
  { key: 'compass', label: '找银河', icon: '✦' },
  { key: 'map', label: '光污染', icon: '🗺' },
  { key: 'conditions', label: '观测条件', icon: '🌙' },
]

export function TabBar({ tab, onChange }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.key}
          className={'tabbtn' + (tab === t.key ? ' active' : '')}
          onClick={() => onChange(t.key)}
        >
          <span className="tabicon">{t.icon}</span>
          <span className="tablabel">{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
