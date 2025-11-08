import { useState } from "react";
import { RefreshCcw, Menu, X } from "lucide-react";

import { AccountFilter } from "@/components/AccountFilter";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmailDetail } from "@/components/EmailDetail";
import { EmailList } from "@/components/EmailList";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { SearchBar } from "@/components/SearchBar";
import { useFilterStore } from "@/stores/filterStore";

function App() {
  const [selectedEmailId, setSelectedEmailId] = useState<string>();
  const resetFilters = useFilterStore((state) => state.reset);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {/* Fixed Header */}
      <header className="header">
        <div>
          <h1>Email Onebox</h1>
          <p>Unified inbox with AI categorization, search, and smart replies.</p>
        </div>
        <div className="header-actions">
          <button className="button" onClick={() => resetFilters()}>
            <RefreshCcw size={16} /> Reset
          </button>
          <button
            className="button mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-content">
            <AccountFilter />
            <SearchBar />
            <CategoryFilter />
            <KnowledgePanel />
          </div>
        </aside>

        {/* Email Workspace */}
        <div className="workspace">
          <div className="pane email-list-pane">
            <div className="pane-scroll">
              <EmailList
                selectedEmailId={selectedEmailId}
                onSelect={setSelectedEmailId}
              />
            </div>
          </div>
          <div className="pane email-detail-pane">
            <div className="pane-scroll">
              <EmailDetail emailId={selectedEmailId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
