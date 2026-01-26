"use client";

import { useState } from "react";
import { useSettingsStore } from "../../lib/stores";
import { Modal } from "../ui/Modal";
import { Globe, Upload, ArrowRight, Info } from "lucide-react";
import { IconButton } from "../ui/IconButton";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSourceModal({ isOpen, onClose }: AddSourceModalProps) {
  const settings = useSettingsStore();
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddUrl = () => {
    if (!url) return;
    try {
      const urlObj = new URL(url);
      settings.addDataSource({
        name: urlObj.hostname || "Vzdálený zdroj",
        type: "url",
        url: url,
      });
      setUrl("");
      onClose();
    } catch (err) {
      setError("Neplatná URL adresa");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        settings.addDataSource({
          name: file.name,
          type: "local",
          data: data,
        });
        onClose();
      } catch (err) {
        setError("Chyba při čtení souboru. Ujistěte se, že jde o platný JSON.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Přidat zdroj otázek"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        <div className="glass-card-themed p-4 bg-blue-500/5 border-blue-500/10 flex gap-3 items-start">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
            Zdrojem musí být JSON soubor obsahující seznam otázek ve správném
            formátu. Můžete použít URL adresu na veřejný soubor nebo nahrát
            vlastní ze zařízení.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--fg-muted)] ml-1">
              Vložit URL adresu
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://example.com/questions.json"
                className="glass-input pr-12 w-full"
              />
              <div className="absolute right-1 top-1">
                <IconButton
                  icon={ArrowRight}
                  variant="frosted"
                  onClick={handleAddUrl}
                  disabled={!url}
                  className="h-8 w-8"
                />
              </div>
            </div>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-[var(--fg-muted)]">
              <span className="bg-[var(--bg-surface)] px-2">Nebo</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase font-bold tracking-widest text-[var(--fg-muted)] ml-1">
              Nahrát soubor
            </label>
            <label className="glass-button w-full flex items-center justify-center gap-3 cursor-pointer py-4 hover:bg-white/5 transition-colors group">
              <Upload
                size={18}
                className="text-[var(--fg-muted)] group-hover:text-[var(--fg-primary)] transition-colors"
              />
              <span className="font-semibold">
                {isUploading ? "Nahrávání..." : "Vybrat .json soubor"}
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center animate-in fade-in zoom-in-95">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
