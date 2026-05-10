import React, { useRef } from 'react';
import {
  Building2,
  Files,
  History,
  ListTree,
  Map,
  Search,
  Settings,
} from 'lucide-react';
import type { IdeActivityRailItem } from '@/types/state';

type ActivityRailBadge = number | 'dot';

interface ActivityRailProps {
  active: IdeActivityRailItem;
  badges?: Partial<Record<IdeActivityRailItem, ActivityRailBadge>>;
  onSelect: (item: IdeActivityRailItem) => void;
}

interface RailItem {
  id: IdeActivityRailItem;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>;
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'settings',    label: 'Settings',     Icon: Settings    },
  { id: 'explorer',    label: 'Explorer',     Icon: Files       },
  { id: 'outline',     label: 'Outline',      Icon: ListTree    },
  { id: 'search',      label: 'Search',       Icon: Search      },
  { id: 'planHistory', label: 'Plan History', Icon: History     },
  { id: 'mapBridge',   label: 'Map Bridge',   Icon: Map         },
  { id: 'urbanBridge', label: 'Urban Bridge', Icon: Building2   },
];

function RailButton({
  item,
  selected,
  badge,
  onSelect,
  onKeyDown,
  setButtonRef,
}: {
  item: RailItem;
  selected: boolean;
  badge: ActivityRailBadge | undefined;
  onSelect: (id: IdeActivityRailItem) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, id: IdeActivityRailItem) => void;
  setButtonRef: (id: IdeActivityRailItem, element: HTMLButtonElement | null) => void;
}) {
  const { id, label, Icon } = item;
  return (
    <button
      key={id}
      ref={element => setButtonRef(id, element)}
      type="button"
      className="synapse-ide-shell__activity-button"
      data-active={selected ? 'true' : 'false'}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      tabIndex={selected ? 0 : -1}
      onClick={() => onSelect(id)}
      onKeyDown={event => onKeyDown(event, id)}
    >
      <Icon size={16} strokeWidth={selected ? 2.2 : 1.7} aria-hidden />
      <span className="synapse-ide-shell__activity-label">{label}</span>
      {badge ? (
        <span
          className="synapse-ide-shell__activity-badge"
          data-kind={badge === 'dot' ? 'dot' : 'count'}
          aria-hidden="true"
        >
          {badge === 'dot' ? '' : badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </button>
  );
}

export const ActivityRail: React.FC<ActivityRailProps> = ({ active, badges, onSelect }) => {
  const buttonRefs = useRef<Partial<Record<IdeActivityRailItem, HTMLButtonElement | null>>>({});

  const focusAndSelect = (item: IdeActivityRailItem) => {
    onSelect(item);
    requestAnimationFrame(() => buttonRefs.current[item]?.focus());
  };

  const handleRailKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    id: IdeActivityRailItem
  ) => {
    const currentIndex = RAIL_ITEMS.findIndex(item => item.id === id);
    if (currentIndex < 0) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % RAIL_ITEMS.length;
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + RAIL_ITEMS.length) % RAIL_ITEMS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = RAIL_ITEMS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    focusAndSelect(RAIL_ITEMS[nextIndex].id);
  };

  return (
    <nav
      className="synapse-ide-shell__activity-rail"
      data-region="activity-rail"
      aria-label="Synapse IDE activity rail"
    >
      {RAIL_ITEMS.map(item => (
        <RailButton
          key={item.id}
          item={item}
          selected={active === item.id}
          badge={badges?.[item.id]}
          onSelect={onSelect}
          onKeyDown={handleRailKeyDown}
          setButtonRef={(id, element) => {
            buttonRefs.current[id] = element;
          }}
        />
      ))}
    </nav>
  );
};

export default ActivityRail;
