import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Icon, type IconName } from './Icon';

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const pills: [IconName, string][] = [
    ['lock', t('pill1')],
    ['gift', t('pill2')],
    ['code', t('pill3')],
  ];

  return (
    <div className="flex flex-col items-center text-center gap-3 pt-2">
      <h1 className="text-[2.15rem] leading-[1.08] sm:text-5xl font-semibold text-[var(--wm-ink)]">
        {t('heroTitle')}
      </h1>
      <p className="text-sm text-[var(--wm-muted)] max-w-sm">{t('heroSubtitle')}</p>

      <ul className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs font-medium text-[var(--wm-ink)] list-none m-0 p-0">
        {pills.map(([icon, label]) => (
          <li
            key={icon}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--wm-surface)] border border-[var(--wm-border)]"
          >
            <Icon name={icon} className="w-3.5 h-3.5 text-[var(--wm-signal-text)]" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};
