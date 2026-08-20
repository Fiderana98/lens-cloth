import React, { useState, useEffect } from 'react';
import { CameraView } from './components/CameraView';
import { ResultsList } from './components/ResultsList';
import { SettingsModal } from './components/SettingsModal';
import { ClothingItem, SearchLensResponse } from './types';
import { Settings, ScanLine, AlertCircle } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [clothingType, setClothingType] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [serpApiKey, setSerpApiKey] = useState<string>(() => {
    return localStorage.getItem('serpapi_api_key') || '';
  });

  const handleSaveSerpApiKey = (key: string) => {
    setSerpApiKey(key);
    localStorage.setItem('serpapi_api_key', key);
  };

  const handleSearch = async (imageBase64: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search-lens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64,
          serpApiKey: serpApiKey || undefined,
        }),
      });

      const data: SearchLensResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la recherche visuelle.');
      }

      setItems(data.items);
      setEngineUsed(data.engineUsed);
      setClothingType(data.clothingTypeDetected);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Impossible de trouver des articles similaires. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setItems([]);
    setHasSearched(false);
    setError(null);
  };

  return (
    <main className="w-full h-screen h-[100dvh] flex flex-col bg-zinc-950 text-white select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="flex-shrink-0 h-14 px-4 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
            <ScanLine className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              <span>Lens Cloth Finder</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-medium leading-none">
              Recherche visuelle SerpApi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Paramètres & Flutter"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Alert Bar */}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800/50 px-4 py-2.5 flex items-center justify-between text-xs text-red-200 z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            id="dismiss-error-btn"
            onClick={() => setError(null)}
            className="text-[11px] underline font-medium hover:text-white ml-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Loading Overlay with Scanning effect */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-2xl border-2 border-zinc-800 flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-bounce top-1/2" />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">
              Recherche des vêtements similaires...
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              Analyse visuelle SerpApi et identification des boutiques et fiches produits.
            </p>
          </div>
        )}

        {/* View Switcher: Live Viewfinder OR Results */}
        {!hasSearched ? (
          <CameraView onCapture={handleSearch} isLoading={isLoading} />
        ) : (
          <ResultsList
            items={items}
            engineUsed={engineUsed}
            clothingTypeDetected={clothingType}
            onReset={handleReset}
          />
        )}
      </div>

      {/* Settings & Flutter APK Compilation Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        serpApiKey={serpApiKey}
        onSaveSerpApiKey={handleSaveSerpApiKey}
      />
    </main>
  );
}
