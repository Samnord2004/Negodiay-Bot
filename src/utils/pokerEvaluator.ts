import { Card, CardSuit, HandEvaluation, HandRankType } from '../types/poker';

export const CARD_SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const SUIT_SYMBOLS: Record<CardSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

export const SUIT_COLORS: Record<CardSuit, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-500',
  clubs: 'text-stone-900',
  spades: 'text-stone-900'
};

export function getCardValueName(value: number): string {
  switch (value) {
    case 14: return 'Туз';
    case 13: return 'Король';
    case 12: return 'Дама';
    case 11: return 'Валет';
    case 10: return '10';
    case 9: return '9';
    case 8: return '8';
    case 7: return '7';
    case 6: return '6';
    case 5: return '5';
    case 4: return '4';
    case 3: return '3';
    case 2: return '2';
    default: return String(value);
  }
}

export function getCardValueSymbol(value: number): string {
  switch (value) {
    case 14: return 'A';
    case 13: return 'K';
    case 12: return 'Q';
    case 11: return 'J';
    default: return String(value);
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of CARD_SUITS) {
    for (let value = 2; value <= 14; value++) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper combinations of 5 from N
function getCombinations<T>(array: T[], size: number): T[][] {
  function p(t: T[], i: number) {
    if (t.length === size) {
      result.push(t);
      return;
    }
    if (i + 1 > array.length) {
      return;
    }
    p(t.concat([array[i]]), i + 1);
    p(t, i + 1);
  }
  const result: T[][] = [];
  p([], 0);
  return result;
}

function evaluate5Cards(cards: Card[]): { score: number; rank: HandRankType; rankName: string; description: string } {
  // Sort descending by value
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const suits = sorted.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  // Check straight
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight: values are consecutive
  if (
    values[0] - values[1] === 1 &&
    values[1] - values[2] === 1 &&
    values[2] - values[3] === 1 &&
    values[3] - values[4] === 1
  ) {
    isStraight = true;
    straightHigh = values[0];
  } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    // Wheel straight: A-2-3-4-5
    isStraight = true;
    straightHigh = 5;
  }

  // Count value frequencies
  const valueCounts: Record<number, number> = {};
  for (const v of values) {
    valueCounts[v] = (valueCounts[v] || 0) + 1;
  }

  const counts = Object.entries(valueCounts).map(([val, count]) => ({
    val: Number(val),
    count
  })).sort((a, b) => b.count - a.count || b.val - a.val);

  // 1. Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return {
      score: 9000000,
      rank: 'royal_flush',
      rankName: 'Роял-флеш',
      description: 'Роял-флеш (непобедимый натс!)'
    };
  }

  // 2. Straight Flush
  if (isFlush && isStraight) {
    return {
      score: 8000000 + straightHigh,
      rank: 'straight_flush',
      rankName: 'Стрит-флеш',
      description: `Стрит-флеш до ${getCardValueName(straightHigh)}`
    };
  }

  // 3. Four of a kind
  if (counts[0].count === 4) {
    const kicker = counts[1].val;
    return {
      score: 7000000 + counts[0].val * 100 + kicker,
      rank: 'four_of_a_kind',
      rankName: 'Каре',
      description: `Каре из ${getCardValueName(counts[0].val)}`
    };
  }

  // 4. Full House
  if (counts[0].count === 3 && counts[1].count === 2) {
    return {
      score: 6000000 + counts[0].val * 100 + counts[1].val,
      rank: 'full_house',
      rankName: 'Фулл-хаус',
      description: `Фулл-хаус (${getCardValueName(counts[0].val)} и ${getCardValueName(counts[1].val)})`
    };
  }

  // 5. Flush
  if (isFlush) {
    const tie = values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
    return {
      score: 5000000 + tie,
      rank: 'flush',
      rankName: 'Флеш',
      description: `Флеш (старшая: ${getCardValueName(values[0])})`
    };
  }

  // 6. Straight
  if (isStraight) {
    return {
      score: 4000000 + straightHigh,
      rank: 'straight',
      rankName: 'Стрит',
      description: `Стрит до ${getCardValueName(straightHigh)}`
    };
  }

  // 7. Three of a kind
  if (counts[0].count === 3) {
    const tie = counts[0].val * 1000 + counts[1].val * 10 + counts[2].val;
    return {
      score: 3000000 + tie,
      rank: 'three_of_a_kind',
      rankName: 'Тройка / Сет',
      description: `Тройка ${getCardValueName(counts[0].val)}`
    };
  }

  // 8. Two Pair
  if (counts[0].count === 2 && counts[1].count === 2) {
    const tie = counts[0].val * 1000 + counts[1].val * 100 + counts[2].val;
    return {
      score: 2000000 + tie,
      rank: 'two_pair',
      rankName: 'Две пары',
      description: `Две пары (${getCardValueName(counts[0].val)} и ${getCardValueName(counts[1].val)})`
    };
  }

  // 9. One Pair
  if (counts[0].count === 2) {
    const tie = counts[0].val * 10000 + counts[1].val * 100 + counts[2].val * 10 + counts[3].val;
    return {
      score: 1000000 + tie,
      rank: 'one_pair',
      rankName: 'Пара',
      description: `Пара ${getCardValueName(counts[0].val)}`
    };
  }

  // 10. High card
  const tie = values[0] * 10000 + values[1] * 1000 + values[2] * 100 + values[3] * 10 + values[4];
  return {
    score: tie,
    rank: 'high_card',
    rankName: 'Старшая карта',
    description: `Старшая карта: ${getCardValueName(values[0])}`
  };
}

/**
 * Evaluates the best 5-card hand from hole cards + community cards (up to 7 cards).
 */
export function evaluateHoldemHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];

  if (allCards.length < 5) {
    // If fewer than 5 cards available, calculate temporary rank
    if (holeCards.length === 2 && holeCards[0].value === holeCards[1].value) {
      return {
        score: 1000000 + holeCards[0].value,
        rank: 'one_pair',
        rankName: 'Карманная пара',
        description: `Пара ${getCardValueName(holeCards[0].value)}`,
        bestCards: holeCards
      };
    }
    const high = Math.max(...holeCards.map(c => c.value), 0);
    return {
      score: high,
      rank: 'high_card',
      rankName: 'Старшая карта',
      description: high ? `Старшая карта: ${getCardValueName(high)}` : 'Раздача...',
      bestCards: holeCards
    };
  }

  const combinations = getCombinations(allCards, 5);
  let bestScore = -1;
  let bestEval: { score: number; rank: HandRankType; rankName: string; description: string } = {
    score: 0,
    rank: 'high_card',
    rankName: 'Старшая карта',
    description: ''
  };
  let bestCards: Card[] = [];

  for (const combo of combinations) {
    const ev = evaluate5Cards(combo);
    if (ev.score > bestScore) {
      bestScore = ev.score;
      bestEval = ev;
      bestCards = combo;
    }
  }

  return {
    score: bestEval.score,
    rank: bestEval.rank,
    rankName: bestEval.rankName,
    description: bestEval.description,
    bestCards
  };
}
