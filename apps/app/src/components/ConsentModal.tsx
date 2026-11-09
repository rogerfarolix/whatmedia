import React from 'react';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConsentModal: React.FC<Props> = ({ isOpen, onConfirm, onCancel }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 bg-[var(--wm-surface)] rounded-[var(--wm-radius-card)] border border-[var(--wm-border)] shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">☁️</span>
          <h3 className="text-lg font-bold font-heading text-[var(--wm-ink)]">
            Traitement via notre serveur sécurisé
          </h3>
        </div>

        <p className="text-xs text-[var(--wm-muted)] leading-relaxed">
          Ton navigateur ne supporte pas le traitement direct par WebCodecs. Nous pouvons traiter ta vidéo sur notre serveur open source dédié (Node 22 + ffmpeg).
        </p>

        <div className="p-3 bg-[var(--wm-paper)] border border-[var(--wm-border)] rounded-lg text-xs flex flex-col gap-1.5 text-[var(--wm-ink)]">
          <div>🔒 <strong>Chiffrement HTTPS :</strong> Transfert direct chiffré de bout en bout.</div>
          <div>⏱️ <strong>Suppression automatique :</strong> Fichier détruit sous 15 minutes max.</div>
          <div>🚫 <strong>Aucune conservation :</strong> Aucun compte, aucun traçage.</div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-[var(--wm-radius-button)] text-xs font-semibold text-[var(--wm-muted)] border border-[var(--wm-border)] hover:bg-[var(--wm-paper)] transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-[var(--wm-radius-button)] text-xs font-semibold bg-[var(--wm-signal)] text-white hover:bg-[var(--wm-signal-hover)] transition-all shadow-sm"
          >
            J'accepte et je continue
          </button>
        </div>
      </div>
    </div>
  );
};

