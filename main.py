import os
import random
import json
import urllib.request
import urllib.error
from typing import List

Feedback = List[str]

DEFAULT_VOCAB = [
    "crane",
    "slate",
    "flint",
    "pride",
    "crown",
    "glare",
    "shine",
    "grape",
    "stone",
    "brink",
]


def fetch_word_from_ai() -> str:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        data=json.dumps(
            {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": "Respond with a single random common five-letter English word in lowercase. No explanations.",
                    },
                    {"role": "user", "content": "word"},
                ],
                "max_tokens": 5,
                "temperature": 1,
            }
        ).encode("utf-8"),
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.load(resp)
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenAI request failed: {exc}")
    word = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip().lower()
    if not word.isalpha() or len(word) != 5:
        raise RuntimeError("Invalid word received from OpenAI")
    return word


def evaluate_guess(target: str, guess: str) -> Feedback:
    result: Feedback = ["absent"] * 5
    remaining: List[str] = []
    for i, (g, t) in enumerate(zip(guess, target)):
        if g == t:
            result[i] = "correct"
        else:
            remaining.append(t)
    for i, g in enumerate(guess):
        if result[i] == "correct":
            continue
        if g in remaining:
            result[i] = "present"
            remaining.remove(g)
    return result


class WordleRLSolver:
    def __init__(self, vocabulary: List[str], alpha: float = 0.1, epsilon: float = 0.1):
        self.vocab = vocabulary
        self.alpha = alpha
        self.epsilon = epsilon
        self.q_table = [[0.0] * 5 for _ in range(26)]

    def _letter_index(self, letter: str) -> int:
        return ord(letter) - 97

    def _score(self, word: str) -> float:
        return sum(self.q_table[self._letter_index(c)][i] for i, c in enumerate(word))

    def _choose(self, eligible: List[str]) -> str:
        if random.random() < self.epsilon:
            return random.choice(eligible)
        best = eligible[0]
        best_score = self._score(best)
        for w in eligible[1:]:
            s = self._score(w)
            if s > best_score:
                best_score, best = s, w
        return best

    def _matches(self, word: str, guess: str, feedback: Feedback) -> bool:
        for i, (g, fb) in enumerate(zip(guess, feedback)):
            w = word[i]
            if fb == "correct" and w != g:
                return False
            if fb == "present":
                if w == g or g not in word:
                    return False
            if fb == "absent" and g in word:
                return False
        return True

    def train(self, target: str, max_steps: int = 6) -> List[str]:
        eligible = self.vocab[:]
        guesses: List[str] = []
        for _ in range(max_steps):
            guess = self._choose(eligible)
            guesses.append(guess)
            feedback = evaluate_guess(target, guess)
            for i, (g, fb) in enumerate(zip(guess, feedback)):
                idx = self._letter_index(g)
                reward = 1 if fb == "correct" else 0.5 if fb == "present" else 0
                self.q_table[idx][i] += self.alpha * (reward - self.q_table[idx][i])
            eligible = [w for w in eligible if self._matches(w, guess, feedback)]
            if guess == target:
                break
        return guesses


def print_board(guesses: List[str], target: str) -> None:
    color = {"correct": "\x1b[42m", "present": "\x1b[43m", "absent": "\x1b[100m"}
    reset = "\x1b[0m"
    for guess in guesses:
        fb = evaluate_guess(target, guess)
        line = "".join(f"{color[f]} {c.upper()} {reset}" for c, f in zip(guess, fb))
        print(line)


def main() -> None:
    solver = WordleRLSolver(DEFAULT_VOCAB)
    try:
        target = fetch_word_from_ai()
    except Exception:
        target = random.choice(DEFAULT_VOCAB)
    guesses = solver.train(target)
    print_board(guesses, target)
    if guesses and guesses[-1] == target:
        print(f"Solved in {len(guesses)} guesses!")
    else:
        print(f"Failed to solve. Target word was {target}")


if __name__ == "__main__":
    main()
