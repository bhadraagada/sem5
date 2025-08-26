export type Feedback = 'correct' | 'present' | 'absent';

export function evaluateGuess(target: string, guess: string): Feedback[] {
  const result: Feedback[] = Array<Feedback>(5).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');

  const remaining: string[] = [];
  for (let i = 0; i < 5; i++) {
    const g = guessLetters[i]!;
    const t = targetLetters[i]!;
    if (g === t) {
      result[i] = 'correct';
    } else {
      remaining.push(t);
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    const idx = remaining.indexOf(guessLetters[i]!);
    if (idx !== -1) {
      result[i] = 'present';
      remaining.splice(idx, 1);
    }
  }
  return result;
}
