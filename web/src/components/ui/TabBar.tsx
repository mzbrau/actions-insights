export interface TabItem {
  id: string;
  label: string;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
}

export function TabBar({ tabs, activeTab, onChange, ariaLabel = 'Page sections' }: TabBarProps) {
  return (
    <nav className="tab-bar" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={`tab${activeTab === tab.id ? ' active' : ''}`}
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
