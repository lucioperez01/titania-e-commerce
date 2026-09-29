'use client'

interface Tab {
    label: string
    count?: number
    value: string
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onTabChange: (value: string) => void
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
    return (
        <div className="flex gap-2 border-b border-purple-400/20 pb-0 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = tab.value === activeTab
                return (
                    <button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`flex items-center gap-2 whitespace-nowrap px-4 pb-3 text-sm font-medium transition-colors border-b-2 ${
                            isActive
                                ? "text-white border-purple-400"
                                : "text-slate-400 border-transparent hover:text-slate-300"
                        }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && (
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                    isActive
                                        ? "bg-purple-600/20 text-purple-300"
                                        : "bg-neutral-800 text-slate-400"
                                }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
