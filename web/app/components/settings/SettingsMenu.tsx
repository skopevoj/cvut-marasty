"use client";

import { Database, Users, LayoutGrid, Palette } from "lucide-react";
import { useState } from "react";
import { GeneralTab } from "./GeneralTab";
import { AppearanceTab } from "./AppearanceTab";
import { DataTab } from "./DataTab";
import { SyncTab } from "./SyncTab";

type Tab = "general" | "appearance" | "data" | "sync";

export function SettingsMenu() {
  const [activeTab, setActiveTab] = useState<Tab>("general");

  const SidebarItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: Tab;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2.5 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all whitespace-nowrap shrink-0 ${
        activeTab === id
          ? "bg-[var(--fg-primary)]/10 text-[var(--fg-primary)]"
          : "text-[var(--fg-muted)] hover:bg-[var(--fg-primary)]/5 hover:text-[var(--fg-primary)]"
      }`}
    >
      <Icon size={18} className="md:w-5 md:h-5" />
      <span className="font-medium text-[13px] md:text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row -m-6 h-[80vh] md:h-[500px] bg-[var(--bg-surface)] overflow-hidden rounded-b-3xl">
      {/* Sidebar / Tabs */}
      <div className="md:w-56 border-b md:border-b-0 md:border-r border-[var(--border-default)] p-4 flex md:flex-col gap-1.5 md:gap-1 bg-[var(--fg-primary)]/[0.02] overflow-x-auto scrollbar-hide shrink-0">
        <SidebarItem id="general" label="Obecné" icon={LayoutGrid} />
        <SidebarItem id="appearance" label="Vzhled" icon={Palette} />
        <SidebarItem id="data" label="Zdroje dat" icon={Database} />
        <SidebarItem id="sync" label="Synchronizace" icon={Users} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 md:py-6 scrollbar-hide">
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "data" && <DataTab />}
        {activeTab === "sync" && <SyncTab />}
      </div>
    </div>
  );
}
