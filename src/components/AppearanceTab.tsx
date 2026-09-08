import React, { useRef } from 'react';
import { 
  Palette, Sun, Sliders, RotateCcw, Upload, Image as ImageIcon, 
  Sparkles, Check, Eye
} from 'lucide-react';
import { ThemeConfig, DEFAULT_THEME_CONFIG } from '../types';
import Logo from './Logo';

interface AppearanceTabProps {
  themeConfig: ThemeConfig;
  onUpdateThemeConfig: (newTheme: ThemeConfig) => void;
  customLogo?: string | null;
  onUploadLogo: (file: File) => void;
  onResetLogo: () => void;
}

interface PresetTheme {
  id: string;
  name: string;
  icon: string;
  config: ThemeConfig;
}

const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'classic',
    name: 'Классика Негодяев',
    icon: '🧭',
    config: {
      bgColor: '#FFFBEB',
      textColor: '#451A03',
      accentColor: '#DC2626',
      headerBg: '#FACC15',
      brightness: 100,
      contrast: 100
    }
  },
  {
    id: 'campfire',
    name: 'Ночной у костра',
    icon: '🔥',
    config: {
      bgColor: '#18181B',
      textColor: '#FEF08A',
      accentColor: '#EA580C',
      headerBg: '#27272A',
      brightness: 100,
      contrast: 105
    }
  },
  {
    id: 'forest',
    name: 'Таёжный поход',
    icon: '🌲',
    config: {
      bgColor: '#F0FDF4',
      textColor: '#064E3B',
      accentColor: '#059669',
      headerBg: '#A7F3D0',
      brightness: 100,
      contrast: 100
    }
  },
  {
    id: 'clean',
    name: 'Чистый светлый',
    icon: '📄',
    config: {
      bgColor: '#F8FAFC',
      textColor: '#0F172A',
      accentColor: '#DC2626',
      headerBg: '#FFFFFF',
      brightness: 100,
      contrast: 100
    }
  },
  {
    id: 'sunny',
    name: 'Солнечный слёт',
    icon: '☀️',
    config: {
      bgColor: '#FEF9C3',
      textColor: '#78350F',
      accentColor: '#D97706',
      headerBg: '#FDE047',
      brightness: 102,
      contrast: 100
    }
  }
];

const BG_COLOR_CHIPS = ['#FFFBEB', '#F8FAFC', '#FEF9C3', '#F0FDF4', '#18181B', '#0F172A'];
const TEXT_COLOR_CHIPS = ['#451A03', '#09090B', '#1E293B', '#FEF08A', '#FFFFFF'];
const ACCENT_COLOR_CHIPS = ['#DC2626', '#EA580C', '#D97706', '#059669', '#2563EB', '#7C3AED'];
const HEADER_COLOR_CHIPS = ['#FACC15', '#DC2626', '#FEF08A', '#18181B', '#FFFFFF', '#059669'];

export default function AppearanceTab({
  themeConfig,
  onUpdateThemeConfig,
  customLogo,
  onUploadLogo,
  onResetLogo
}: AppearanceTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadLogo(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateField = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => {
    onUpdateThemeConfig({
      ...themeConfig,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">

      {/* 1. PRESET THEMES */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" /> Готовые темы
          </span>
          <span className="text-[10px] text-stone-500 font-bold">в 1 клик</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {PRESET_THEMES.map(preset => {
            const isCurrent = 
              themeConfig.bgColor.toLowerCase() === preset.config.bgColor.toLowerCase() &&
              themeConfig.textColor.toLowerCase() === preset.config.textColor.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdateThemeConfig({ ...preset.config })}
                className={`p-2 rounded-xl border-2 text-left transition-all flex flex-col gap-1 ${
                  isCurrent 
                    ? 'border-red-600 bg-red-50/80 shadow-xs ring-1 ring-red-500' 
                    : 'border-amber-200 bg-amber-50/40 hover:bg-amber-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-base">{preset.icon}</span>
                  {isCurrent && <Check size={14} className="text-red-600 font-black" />}
                </div>
                <div className="font-black text-[11px] text-amber-950 truncate leading-tight">
                  {preset.name}
                </div>
                <div className="flex gap-1 mt-0.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs" style={{ backgroundColor: preset.config.bgColor }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs" style={{ backgroundColor: preset.config.headerBg }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs" style={{ backgroundColor: preset.config.accentColor }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BRIGHTNESS & CONTRAST */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-600" /> Яркость и Контраст
          </span>
          <button
            type="button"
            onClick={() => onUpdateThemeConfig({ ...themeConfig, brightness: 100, contrast: 100 })}
            className="text-[10px] text-red-600 hover:text-red-800 font-black flex items-center gap-0.5"
          >
            <RotateCcw size={11} /> 100%
          </button>
        </div>

        {/* Brightness slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <Sun size={13} className="text-amber-600" /> Яркость экрана:
            </span>
            <span className="font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[11px]">
              {themeConfig.brightness}%
            </span>
          </div>
          <input
            type="range"
            min="75"
            max="130"
            step="1"
            value={themeConfig.brightness}
            onChange={(e) => updateField('brightness', Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer h-2 bg-amber-100 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-stone-600 font-bold px-0.5">
            <span>75% (Мягче)</span>
            <span>100%</span>
            <span>130% (Ярче)</span>
          </div>
        </div>

        {/* Contrast slider */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950 flex items-center gap-1">
              <Eye size={13} className="text-amber-600" /> Контрастность:
            </span>
            <span className="font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[11px]">
              {themeConfig.contrast}%
            </span>
          </div>
          <input
            type="range"
            min="75"
            max="140"
            step="1"
            value={themeConfig.contrast}
            onChange={(e) => updateField('contrast', Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer h-2 bg-amber-100 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-stone-600 font-bold px-0.5">
            <span>75% (Пастель)</span>
            <span>100%</span>
            <span>140% (Четче)</span>
          </div>
        </div>
      </div>

      {/* 3. COLOR CUSTOMIZATION (BG, TEXT, ACCENT) */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-3">
        <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5 border-b border-amber-100 pb-1.5">
          <Palette size={13} className="text-amber-600" /> Настройка цветов сайта
        </span>

        {/* Background Color */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950">Цвет фона сайта:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={themeConfig.bgColor}
                onChange={(e) => updateField('bgColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-stone-300 p-0"
              />
              <span className="font-mono text-[10px] text-stone-600 font-bold uppercase">
                {themeConfig.bgColor}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {BG_COLOR_CHIPS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateField('bgColor', c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform shadow-2xs ${
                  themeConfig.bgColor.toLowerCase() === c.toLowerCase() 
                    ? 'border-red-600 scale-110 ring-2 ring-red-400' 
                    : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-1.5 pt-1 border-t border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950">Цвет текста:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={themeConfig.textColor}
                onChange={(e) => updateField('textColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-stone-300 p-0"
              />
              <span className="font-mono text-[10px] text-stone-600 font-bold uppercase">
                {themeConfig.textColor}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {TEXT_COLOR_CHIPS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateField('textColor', c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform shadow-2xs ${
                  themeConfig.textColor.toLowerCase() === c.toLowerCase() 
                    ? 'border-red-600 scale-110 ring-2 ring-red-400' 
                    : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Header Color */}
        <div className="space-y-1.5 pt-1 border-t border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950">Цвет шапки меню:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={themeConfig.headerBg}
                onChange={(e) => updateField('headerBg', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-stone-300 p-0"
              />
              <span className="font-mono text-[10px] text-stone-600 font-bold uppercase">
                {themeConfig.headerBg}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {HEADER_COLOR_CHIPS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateField('headerBg', c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform shadow-2xs ${
                  themeConfig.headerBg.toLowerCase() === c.toLowerCase() 
                    ? 'border-red-600 scale-110 ring-2 ring-red-400' 
                    : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-1.5 pt-1 border-t border-amber-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-950">Цвет акцентов & кнопок:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={themeConfig.accentColor}
                onChange={(e) => updateField('accentColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-stone-300 p-0"
              />
              <span className="font-mono text-[10px] text-stone-600 font-bold uppercase">
                {themeConfig.accentColor}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ACCENT_COLOR_CHIPS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateField('accentColor', c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform shadow-2xs ${
                  themeConfig.accentColor.toLowerCase() === c.toLowerCase() 
                    ? 'border-red-600 scale-110 ring-2 ring-red-400' 
                    : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. TEAM LOGO UPLOAD & RESET */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
          <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
            <ImageIcon size={13} className="text-amber-600" /> Логотип команды
          </span>
          <span className="text-[9px] text-stone-500 font-bold">из файла</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
            {customLogo && customLogo.trim() ? (
              <img src={customLogo.trim()} alt="Логотип команды" className="w-full h-full object-contain" />
            ) : (
              <Logo size="sm" className="w-full h-full object-contain" />
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <input
              ref={fileInputRef}
              id="appearance-logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <label
              htmlFor="appearance-logo-input"
              className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs uppercase rounded-xl border border-amber-950 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 text-center"
            >
              <Upload size={14} />
              <span>Загрузить логотип из файла</span>
            </label>

            {customLogo && (
              <button
                type="button"
                onClick={onResetLogo}
                className="w-full py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10px] uppercase rounded-xl border border-stone-300 transition-colors text-center"
              >
                Вернуть исходный логотип
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. RESET ALL */}
      <button
        type="button"
        onClick={() => {
          onUpdateThemeConfig(DEFAULT_THEME_CONFIG);
        }}
        className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs uppercase rounded-xl border border-amber-400 transition-colors flex items-center justify-center gap-1.5"
      >
        <RotateCcw size={13} />
        <span>Сбросить оформление по умолчанию</span>
      </button>

    </div>
  );
}
