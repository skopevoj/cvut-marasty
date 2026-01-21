'use client';

import { Config } from '../types';

interface FolderManagerProps {
    config: Config;
    selectedFolder: string;
    onFolderSelect: (folder: string) => void;
    onConfigChange: (config: Config) => void;
}

export function FolderManager({ config, selectedFolder, onFolderSelect, onConfigChange }: FolderManagerProps) {
    function handleAddFolder() {
        const folderPath = prompt('Enter the absolute path to your questions folder:');
        if (folderPath) {
            const newConfig = {
                ...config,
                folders: [...config.folders, folderPath],
            };
            onConfigChange(newConfig);
            onFolderSelect(folderPath);
        }
    }

    function handleRemoveFolder(folder: string) {
        if (confirm(`Remove folder: ${folder}?`)) {
            const newConfig = {
                ...config,
                folders: config.folders.filter(f => f !== folder),
            };
            onConfigChange(newConfig);
            if (selectedFolder === folder) {
                onFolderSelect(newConfig.folders[0] || '');
            }
        }
    }

    return (
        <div className="bg-card rounded-lg border shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Question Folders</h2>
                <button
                    onClick={handleAddFolder}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Add Folder
                </button>
            </div>

            {config.folders.length === 0 ? (
                <p className="text-muted-foreground text-sm">No folders configured</p>
            ) : (
                <div className="space-y-2">
                    {config.folders.map((folder) => (
                        <div
                            key={folder}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-colors ${selectedFolder === folder
                                    ? 'border-primary bg-accent'
                                    : 'border-border hover:bg-accent/50'
                                }`}
                            onClick={() => onFolderSelect(folder)}
                        >
                            <span className="text-sm font-mono text-foreground">{folder}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFolder(folder);
                                }}
                                className="px-3 py-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
