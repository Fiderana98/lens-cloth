import React from 'react';
import { ClothingItem } from '../types';
import { ExternalLink, ArrowLeft, RefreshCw } from 'lucide-react';

interface ResultsListProps {
  items: ClothingItem[];
  engineUsed: string;
  clothingTypeDetected?: string;
  onReset: () => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  items,
  onReset,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Minimal Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md flex items-center justify-between z-10">
        <button
          id="btn-back-to-camera"
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Nouvelle photo</span>
        </button>

        <span className="text-xs font-medium text-zinc-400">
          {items.length} articles trouvés
        </span>

        <button
          id="btn-refresh-search"
          onClick={onReset}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title="Recommencer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Results Grid - Strictly Displaying Thumbnail, Source, Title, Link */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <p className="text-sm text-zinc-400 mb-4">Aucun article similaire trouvé.</p>
            <button
              id="btn-retry-empty"
              onClick={onReset}
              className="py-2.5 px-5 bg-white text-black text-xs font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Reprendre une photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto pb-12">
            {items.map((item) => (
              <div
                key={item.id}
                id={`clothing-item-${item.id}`}
                className="flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors"
              >
                {/* 1. Miniature (Image Thumbnail) */}
                <div className="relative aspect-[3/4] w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback placeholder if image fails to load
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-medium">
                      Pas d'image
                    </div>
                  )}
                </div>

                {/* Content: 2. Source/Site, 3. Titre, 4. Lien */}
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    {/* 2. Source / Site */}
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-zinc-400 block truncate mb-1">
                      {item.source}
                    </span>

                    {/* 3. Titre */}
                    <h3 className="text-xs font-medium text-zinc-100 line-clamp-2 leading-snug mb-3">
                      {item.title}
                    </h3>
                  </div>

                  {/* 4. Lien vers l'article */}
                  <a
                    id={`link-${item.id}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 rounded-lg text-xs font-medium text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Voir l'article</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
