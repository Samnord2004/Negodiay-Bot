import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-12 w-16',
    md: 'h-24 w-32',
    lg: 'h-48 w-64',
    xl: 'h-64 w-80'
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Detailed SVG illustrating the crazy boy with slingshot, rocker horns, and comic word "НЕГОДЯИ" */}
      <svg
        viewBox="0 0 600 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClasses[size]} transition-transform duration-300 hover:scale-105`}
      >
        {/* Wild hair - Spikey red cartoon hair */}
        <path
          d="M 220,120 C 180,80 200,30 250,50 C 270,10 320,10 340,40 C 370,5 420,30 400,80 C 440,80 445,130 410,150 C 430,170 390,210 380,180"
          fill="#E53E3E"
          stroke="#9B2C2C"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Head / Face boundary */}
        <path
          d="M 230,120 Q 200,160 210,200 Q 220,240 280,260 Q 340,270 390,240 Q 420,200 400,150 Q 380,110 310,110 Z"
          fill="#FFFBEB"
          stroke="#E53E3E"
          strokeWidth="8"
          strokeLinejoin="round"
        />

        {/* Crazed Spikey hair strands falling onto forehead */}
        <path
          d="M 230,120 L 260,160 L 280,120 L 310,175 L 340,115 L 360,165 L 390,120"
          fill="#E53E3E"
          stroke="#9B2C2C"
          strokeWidth="3"
        />

        {/* Huge goofy cartoon eyes */}
        <ellipse cx="275" cy="155" rx="30" ry="40" fill="white" stroke="#E53E3E" strokeWidth="6" />
        <ellipse cx="345" cy="155" rx="30" ry="40" fill="white" stroke="#E53E3E" strokeWidth="6" />
        {/* Pupils looking at center, crazed look */}
        <circle cx="285" cy="160" r="10" fill="#E53E3E" />
        <circle cx="335" cy="160" r="10" fill="#E53E3E" />
        {/* Eyebrows */}
        <path d="M 245,115 Q 275,100 295,120" stroke="#E53E3E" strokeWidth="5" strokeLinecap="round" />
        <path d="M 375,115 Q 345,100 325,120" stroke="#E53E3E" strokeWidth="5" strokeLinecap="round" />

        {/* Funny cartoon nose */}
        <path d="M 300,185 C 290,200 320,200 310,185" fill="#E53E3E" stroke="#E53E3E" strokeWidth="4" />

        {/* Giant rebellious grin */}
        <path
          d="M 240,200 Q 310,260 380,200 Q 310,220 240,200"
          fill="#E53E3E"
          stroke="#E53E3E"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Goofy missing teeth */}
        <rect x="280" y="210" width="16" height="14" fill="white" stroke="#E53E3E" strokeWidth="2" rx="2" />
        <rect x="320" y="210" width="16" height="14" fill="white" stroke="#E53E3E" strokeWidth="2" rx="2" />
        {/* Crazy tongue hanging out */}
        <path
          d="M 290,222 Q 310,260 330,222 Z"
          fill="#FEB2B2"
          stroke="#E53E3E"
          strokeWidth="4"
        />

        {/* Left hand (Rocker Sign "🤘") on left side */}
        <g transform="translate(10, 50)">
          {/* Rock and roll hand outline in red with rich fill */}
          <path
            d="M 170,140 L 160,200 Q 155,230 140,250 Q 110,195 110,195 L 80,150 Q 70,135 85,125 Q 100,115 110,135 L 125,170 L 125,75 Q 125,60 140,60 Q 155,60 155,75 L 155,145 L 165,145 L 165,95 Q 165,80 180,80 Q 195,80 195,95 L 195,200"
            fill="#FFFBEB"
            stroke="#E53E3E"
            strokeWidth="8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Details on the folded fingers */}
          <path d="M 125,185 Q 140,195 155,185" stroke="#E53E3E" strokeWidth="4" />
          <path d="M 125,205 Q 140,215 155,205" stroke="#E53E3E" strokeWidth="4" />
        </g>

        {/* Right hand holding slingshot on right side */}
        <g transform="translate(370, 70)">
          {/* Slingshot outline */}
          <path
            d="M 80,80 L 120,40 Q 140,25 150,50 L 110,115 L 115,165 Q 100,185 85,165 L 80,115 L 40,50 Q 50,25 70,40 Z"
            fill="#E53E3E"
            stroke="#9B2C2C"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Elastic bands of slingshot with a loaded pebble */}
          <path d="M 130,45 Q 100,15 75,35" stroke="#E53E3E" strokeWidth="4" strokeLinecap="round" />
          <path d="M 55,45 Q 80,15 105,35" stroke="#E53E3E" strokeWidth="4" strokeLinecap="round" />
          {/* Pebble Pouch */}
          <ellipse cx="90" cy="23" rx="14" ry="8" fill="#E53E3E" stroke="#9B2C2C" strokeWidth="2" />
          {/* Impact/Sparkles */}
          <path d="M 70,15 L 60,5" stroke="#E53E3E" strokeWidth="3" />
          <path d="M 90,10 L 90,0" stroke="#E53E3E" strokeWidth="3" />
          <path d="M 110,15 L 120,5" stroke="#E53E3E" strokeWidth="3" />

          {/* Hand holding slingshot */}
          <path
            d="M 115,115 Q 155,100 165,130 C 175,150 145,190 115,165"
            fill="#FFFBEB"
            stroke="#E53E3E"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          {/* Fingers curled on handle */}
          <path d="M 115,125 Q 140,135 155,125" stroke="#E53E3E" strokeWidth="4" />
          <path d="M 115,138 Q 140,148 152,138" stroke="#E53E3E" strokeWidth="4" />
          <path d="M 115,150 Q 138,160 148,150" stroke="#E53E3E" strokeWidth="4" />
        </g>

        {/* Brand Text "НЕГОДЯИ" wrapped in curved design */}
        <g transform="translate(10, 275)">
          {/* Path for letters or direct drawing of "НЕГОДЯИ" stylized letters */}
          {/* Letter Н */}
          <path d="M 30,50 L 30,120 M 30,85 L 75,85 M 75,50 L 75,120" stroke="#E53E3E" strokeWidth="24" strokeLinecap="round" />

          {/* Letter Е */}
          <path d="M 105,50 L 105,120 M 105,50 L 145,52 M 105,85 L 138,85 M 105,120 L 145,118" stroke="#E53E3E" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />

          {/* Letter Г */}
          <path d="M 175,120 L 175,50 L 215,50" fill="none" stroke="#E53E3E" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />

          {/* Letter О (big circle) */}
          <circle cx="265" cy="85" r="38" stroke="#E53E3E" strokeWidth="24" fill="none" />
          {/* White inner dot for stylistic flair */}
          <circle cx="275" cy="100" r="10" fill="#E53E3E" />

          {/* Letter Д */}
          <path d="M 330,120 L 330,135 M 390,120 L 390,135 M 340,115 L 340,65 L 380,65 L 380,115 Z" fill="none" stroke="#E53E3E" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />

          {/* Explosive burst on the letter Я */}
          <path
            d="M 430,70 L 415,85 L 410,65 L 395,75 L 400,55 L 385,45 L 405,42 L 410,25 L 420,40 L 440,30 L 430,48"
            fill="#FFFBEB"
            stroke="#E53E3E"
            strokeWidth="4"
          />

          {/* Letter Я */}
          <path d="M 465,120 L 465,50 M 465,50 C 430,50 430,85 465,85 M 465,85 L 435,120" fill="none" stroke="#E53E3E" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />

          {/* Letter И */}
          <path d="M 505,50 L 505,120 M 505,120 L 550,50 M 550,50 L 550,120" stroke="#E53E3E" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" />
          {/* Accent or asterisk over И */}
          <path d="M 515,25 Q 527,15 540,25" stroke="#E53E3E" strokeWidth="12" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
