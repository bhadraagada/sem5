import { fetchWordFromAI } from './openAI';
import { evaluateGuess } from './feedback';
import type { Feedback } from './feedback';

export class WordleRLSolver {
  private qTable: number[][]; // [letter][position]
  private vocabulary: string[];
  private alpha: number;
  private epsilon: number;

  constructor(vocabulary: string[], alpha = 0.1, epsilon = 0.1) {
    this.vocabulary = vocabulary;
    this.alpha = alpha;
    this.epsilon = epsilon;
    this.qTable = Array.from({ length: 26 }, () => Array<number>(5).fill(0));
  }

  private letterIndex(letter: string): number {
    return letter.charCodeAt(0) - 97;
  }

  private score(word: string): number {
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const idx = this.letterIndex(word[i]!);
      const row = this.qTable[idx]!;
      total += row[i]!;
    }
    return total;
  }

  private choose(eligible: string[]): string {
    if (Math.random() < this.epsilon) {
      return eligible[Math.floor(Math.random() * eligible.length)]!;
    }
    let best = eligible[0]!;
    let bestScore = this.score(best);
    for (const word of eligible.slice(1)) {
      const s = this.score(word);
      if (s > bestScore) {
        bestScore = s;
        best = word;
      }
    }
    return best;
  }

  train(target: string, maxSteps = 6): string[] {
    let eligible = [...this.vocabulary];
    const guesses: string[] = [];
    for (let step = 0; step < maxSteps; step++) {
      const guess = this.choose(eligible);
      guesses.push(guess);
      const feedback = evaluateGuess(target, guess);

      for (let i = 0; i < 5; i++) {
        const idx = this.letterIndex(guess[i]!);
        let reward = 0;
        if (feedback[i] === 'correct') reward = 1;
        else if (feedback[i] === 'present') reward = 0.5;
        const row = this.qTable[idx]!;
        row[i]! += this.alpha * (reward - row[i]!);
      }

      eligible = eligible.filter((word) => this.matches(word, guess, feedback));

      if (guess === target) break;
    }
    return guesses;
  }

  private matches(word: string, guess: string, feedback: Feedback[]): boolean {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i]!;
      const w = word[i]!;
      switch (feedback[i]) {
        case 'correct':
          if (w !== letter) return false;
          break;
        case 'present':
          if (w === letter || !word.includes(letter)) return false;
          break;
        case 'absent':
          if (word.includes(letter)) return false;
          break;
      }
    }
    return true;
  }

  async trainWithAI(maxSteps = 6): Promise<string[]> {
    const target = await fetchWordFromAI();
    return this.train(target, maxSteps);
  }
}

export const DEFAULT_VOCAB = [
  'crane',
  'slate',
  'flint',
  'pride',
  'crown',
  'glare',
  'shine',
  'grape',
  'stone',
  'brink',
];
