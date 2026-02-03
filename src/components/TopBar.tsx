import TabStrip from "./TabStrip";
import Omnibox from "./Omnibox";
import { type Tab } from "../bridge/types";

type TopBarProps = {
  tabs: Tab[];
  activeTab: Tab | null;
  onActivateTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onNavigate: (input: string) => void;
  onReload: () => void;
  onBack: () => void;
  onForward: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
  orientation?: "horizontal" | "vertical";
  compact?: boolean;
  dense?: boolean;
  onTabContextMenu?: (id: string, x: number, y: number) => void;
};

const TopBar = ({
  tabs,
  activeTab,
  onActivateTab,
  onCloseTab,
  onNewTab,
  onNavigate,
  onReload,
  onBack,
  onForward,
  onBookmark,
  isBookmarked,
  orientation = "horizontal",
  compact = false,
  dense = false,
  onTabContextMenu,
}: TopBarProps) => {
  return (
    <div className={`top-bar ${compact ? "compact" : ""}`}>
      <TabStrip
        tabs={tabs}
        onActivate={onActivateTab}
        onClose={onCloseTab}
        onNewTab={onNewTab}
        orientation={orientation}
        dense={dense}
        onContextMenu={onTabContextMenu}
      />
      <Omnibox
        activeUrl={activeTab?.url ?? ""}
        onNavigate={onNavigate}
        onReload={onReload}
        onBack={onBack}
        onForward={onForward}
        onBookmark={onBookmark}
        isBookmarked={isBookmarked}
      />
    </div>
  );
};

export default TopBar;
