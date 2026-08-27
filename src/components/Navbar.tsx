import React from 'react';

export type TabType = 'home' | 'workout' | 'challenges' | 'stats';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isWorkoutActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isWorkoutActive,
}) => {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      ),
    },
    {
      id: 'workout',
      label: isWorkoutActive ? 'Active Reps' : 'Workout',
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      isHero: true,
    },
    {
      id: 'challenges',
      label: 'Challenges',
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: (active: boolean) => (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-[#0D0D0D] border-t border-[#1A1A1A] px-4 flex items-center justify-around sm:justify-center sm:gap-20">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        if (tab.isHero) {
          return (
            <button
              key={tab.id}
              id={`nav-btn-${tab.id}`}
              onClick={() => onSelectTab(tab.id as TabType)}
              className="relative -top-2 flex flex-col items-center group focus:outline-none"
            >
              <div
                className={`w-13 h-13 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(242,125,38,0.25)] ${
                  isActive || isWorkoutActive
                    ? 'bg-[#F27D26] text-black'
                    : 'bg-[#111111] border border-[#222222] text-[#F27D26] hover:border-[#F27D26]'
                }`}
              >
                {tab.icon(isActive || isWorkoutActive)}
              </div>
              <span
                className={`text-[10px] font-bold uppercase mt-1 tracking-tight ${
                  isActive || isWorkoutActive ? 'text-[#F27D26]' : 'text-gray-500 group-hover:text-gray-300'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            onClick={() => onSelectTab(tab.id as TabType)}
            className={`flex flex-col items-center gap-1.5 py-1 px-3 transition-colors focus:outline-none ${
              isActive ? 'text-[#F27D26]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon(isActive)}
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
