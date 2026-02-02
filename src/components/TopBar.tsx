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
}: TopBarProps) => {
  return (
    <div className="top-bar">
      <TabStrip tabs={tabs} onActivate={onActivateTab} onClose={onCloseTab} onNewTab={onNewTab} />
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
