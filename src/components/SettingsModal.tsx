import React, { useState } from 'react';
import { X, Key, Smartphone, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serpApiKey: string;
  onSaveSerpApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  serpApiKey,
  onSaveSerpApiKey,
}) => {
  const [localKey, setLocalKey] = useState(serpApiKey);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'serpapi' | 'flutter' | 'permissions'>('serpapi');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSerpApiKey(localKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Paramètres & Flutter APK</h2>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-zinc-800 px-4 pt-2 gap-2 text-xs font-medium">
          <button
            id="tab-serpapi"
            onClick={() => setActiveTab('serpapi')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              activeTab === 'serpapi'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SerpApi Key
          </button>
          <button
            id="tab-flutter"
            onClick={() => setActiveTab('flutter')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              activeTab === 'flutter'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Compilation Flutter / APK
          </button>
          <button
            id="tab-permissions"
            onClick={() => setActiveTab('permissions')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Permissions
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-zinc-300">
          {activeTab === 'serpapi' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-100 font-medium">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Clé d'API SerpApi (Google Lens)</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Renseignez votre clé SerpApi pour utiliser directement l'API officielle SerpApi Google Lens. Si aucune clé n'est fournie, le moteur visuel intelligent prend le relais automatiquement.
              </p>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  SerpApi Private Key
                </label>
                <input
                  id="serpapi-key-input"
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder="Ex: 5f98a2..."
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-zinc-500"
                />
              </div>
              <button
                id="save-serpapi-btn"
                onClick={handleSave}
                className="w-full py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Enregistré !</span>
                  </>
                ) : (
                  <span>Enregistrer la clé</span>
                )}
              </button>
            </div>
          )}

          {activeTab === 'flutter' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-100 font-medium">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Architecture Flutter & Android APK</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Pour compiler en APK Android avec Flutter, ajoutez les dépendances suivantes dans votre <code className="text-zinc-200 bg-zinc-950 px-1 py-0.5 rounded">pubspec.yaml</code> :
              </p>
              <pre className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`dependencies:
  flutter:
    sdk: flutter
  camera: ^0.10.5+9
  image_picker: ^1.0.7
  permission_handler: ^11.3.1
  http: ^1.2.0
  url_launcher: ^6.2.5`}
              </pre>
              <p className="text-zinc-400 leading-relaxed">
                Commande de compilation APK Android :
              </p>
              <pre className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-200">
                flutter build apk --release
              </pre>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-100 font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Permissions Android & Web</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="font-semibold text-white mb-0.5">android.permission.CAMERA</div>
                  <div className="text-zinc-400 text-[11px]">Permet de filmer et capturer les vêtements en direct.</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="font-semibold text-white mb-0.5">android.permission.READ_MEDIA_IMAGES</div>
                  <div className="text-zinc-400 text-[11px]">Permet d'importer une photo depuis la galerie ou le stockage local.</div>
                </div>
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <div className="font-semibold text-white mb-0.5">android.permission.INTERNET</div>
                  <div className="text-zinc-400 text-[11px]">Recherche visuelle SerpApi et accès aux liens des articles.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
