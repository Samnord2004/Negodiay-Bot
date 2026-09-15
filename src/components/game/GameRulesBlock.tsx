import React from 'react';
import { 
  ShieldCheck, Award, Trophy, Sparkles, Flame, CheckCircle, 
  HelpCircle, Compass, HeartHandshake, Tent
} from 'lucide-react';
import { GAME_LEVELS } from '../../types';

export default function GameRulesBlock() {
  return (
    <div className="space-y-8">
      
      {/* MOTTO BANNER */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 sm:p-8 border border-amber-500/40 shadow-xl relative overflow-hidden text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-2xl mx-auto shadow-md border border-yellow-300">
          ⛺
        </div>

        <div className="space-y-1">
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold">
            Кодекс команды
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-2xl mx-auto">
            «Мы — НЕГОДЯИ, но игра должна быть честной и увлекательной!»
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
          Мотивационная игра создана для того, чтобы отметить вклад каждого соратника в подготовку, быт и атмосферу лагеря туристической команды «Негодяи».
        </p>
      </div>

      {/* CORE MECHANICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: ПРИЗ */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            🏆
          </div>
          <h3 className="font-black text-stone-900 text-base">
            Главный приз: Скидка 100%
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Участник, набравший наибольшее количество монет к моменту общего сбора, получает право прийти на следующий слёт <strong>без оплаты вступительного взноса</strong>. Расходы полностью покрываются из накопительного фонда команды.
          </p>
        </div>

        {/* CARD 2: ЧЕКАНКА КАПИТАНА */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center text-xl font-bold">
            👑
          </div>
          <h3 className="font-black text-stone-900 text-base">
            Именные монеты с профилем
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Капитан команды лично чеканит монеты за реальные заслуги: закупку провианта, обустройство лагеря, дежурство у костра, песни под гитару, шеф-поварские шедевры и помощь соратникам. На монете отчеканен силуэт профиля участника.
          </p>
        </div>

        {/* CARD 3: КОЛЕСО ФОРТУНЫ */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
            🎡
          </div>
          <h3 className="font-black text-stone-900 text-base">
            Колесо Фортуны с весами
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Шанс есть у каждого! В Колесе Фортуны действует честный балансировочный алгоритм: <strong>чем меньше у соратника монеток, тем выше вероятность его победы</strong> в ежедневном розыгрыше.
          </p>
        </div>

      </div>

      {/* RANKS AND LEVELS */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="border-b border-stone-100 pb-3">
          <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
            <Award className="text-amber-500" size={20} />
            <span>Система рангов и ступеней братства</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            По мере накопления монет ваш ранг в лагере повышается
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAME_LEVELS.map((lvl) => (
            <div 
              key={lvl.level}
              className={`p-4 rounded-2xl border ${lvl.color} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${lvl.textColor} bg-white/80`}>
                  {lvl.title}
                </span>
                <span className="text-xs font-bold text-stone-500">
                  {lvl.minCoins}+ монет
                </span>
              </div>
              <p className="text-xs text-stone-600">
                {lvl.perk}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CODE OF FAIR PLAY */}
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 space-y-3">
        <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>Кодекс честной игры «Негодяев»</span>
        </h4>
        <ul className="text-xs text-stone-600 space-y-2 list-disc list-inside leading-relaxed">
          <li>Все начисленные монеты отображаются в публичном реестре и истории чеканки.</li>
          <li>Капитан оценивает не формальные галочки, а реальный дух братства, взаимовыручку и создание настроения в лагере.</li>
          <li>Если у вас ещё нет загруженного фото в профиль для чеканки монетки, вы можете обновить его в личном кабинете участника.</li>
          <li>В случае равенства монет у лидеров победитель определяется голосованием на общем костровом круге.</li>
        </ul>
      </div>

    </div>
  );
}
