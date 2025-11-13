#Final Report

## 1. Introduction

This project was a journey through understanding a vanilla-JavaScript Tetris implementation, fixing its issues, and gradually transforming a simple heuristic player into a much stronger AI agent. The goal was not only to improve the AI but to present the whole process as a story — an evolving exploration of ideas, experiments, mistakes, improvements, and eventual breakthroughs.

What follows is the chronological story of how the AI grew from a score of ~200 to over **1500**.

---

## 2. Warming Up: Understanding the Codebase

When I first opened the code, I was greeted by a long but relatively clean `game.js`: rendering, animation via `requestAnimationFrame`, piece definitions, the logic for line clearing, and the general machinery of Tetris. The initial task was to understand how everything interacted — how pieces move, how the board updates, and where the AI hooks in.

During this exploration I found **one main bug** that affected gameplay and AI evaluations:

### **Bug: wrong boundary logic for line checking**
The line-clearing routine wasn’t properly checking the bounds and sometimes mishandled the lowest rows. This could cause lines not to clear when they should, or clear inconsistently.

After fixing this, the game became stable. With that foundation, I moved on to the AI.

---

## 3. Phase One – The Baseline AI (~200 points)

The starting AI was a simple heuristic agent using a handful of features:

- holes  
- bumpiness  
- aggregated height  
- completed rows

The agent tried every rotation and horizontal position, evaluated the resulting board using these features and the current weights, and picked the highest-scoring move.

With the initial weights, the agent averaged roughly **200 points**. Not terrible, but clearly hitting a ceiling.

Still, this provided the baseline for all future improvements.

---

## 4. Phase Two – Adding Features & Tuning Weights (~250 points)

To push the agent further, I expanded the feature set. The new features were motivated by patterns I noticed while watching the AI play:

- **upperRowNum** — how many blocks appear in the topmost filled row  
- **rowBelowUpper** — how many blocks lie directly below it  
- **row2layers** — and two rows below  

The idea was simple: the agent needed a better sense of its skyline. A good Tetris player keeps the board “smooth”; a bad one creates cliffs and pits. These features helped quantify that.

Then came tuning. I implemented a **compact simulated annealing** routine that repeatedly played mini-games, adjusted weights, accepted or rejected changes based on score improvements, and slowly converged toward better parameters.

After multiple rounds of tuning, the improved weights lifted the average score to **~250**.

A small gain — but very meaningful, because beam search was about to multiply it.

---

## 5. Phase Three – Beam Search (~450 points)

The next big step was implementing **beam search**:

- depth 2  
- beam width 30  
- full board simulation  
- scoring with the tuned heuristic  

Beam search allowed the AI to look ahead, rather than greedily choose the immediate best move. This alone made a huge difference. The agent started preparing the ground for future pieces instead of panicking near the end of the game.

Watching it play, I could see behaviors emerging:

- building platforms for long bars  
- avoiding placements that would trap holes  
- “pre-clearing” areas in anticipation of upcoming pieces  

With beam search alone, the performance jumped to **~450 points**, nearly doubling the previous version.

But one more idea completely transformed the AI.

---

## 6. Phase Four – The Breakthrough: Always Take the Line Clear (>1500 points)

While reviewing games, I noticed something frustrating:  
sometimes the agent avoided a move that would instantly clear a line — simply because its heuristic score slightly preferred another placement.

This felt deeply wrong. As Tetris players know, **clearing lines is always valuable**, especially in stressful layouts.

So I added a simple rule to the beam search:

> **If any move clears a line immediately, always take it.**

This was implemented right before beam expansion, and it changed everything. The AI became far more stable. Long losing streaks suddenly became long runs. The board stayed healthy much longer, and the agent reached well beyond 1000 points.

After this final adjustment, the AI consistently scored **around 1500 points**, with some runs going even higher.

This was the biggest improvement of the entire project — a small, human-inspired rule with massive impact.

---

## 7. Final Thoughts

The evolution of the AI paints a very clear story:

| Stage | Change | Score |
|-------|---------|--------|
| **Initial** | Basic heuristic | ~200 |
| **Features + weights** | New features + annealing | ~250 |
| **Beam search** | Lookahead search | ~450 |
| **Line-clear priority** | Human-like rule | ~1500 |

Along the way, I:

- fixed a subtle boundary bug  
- learned the intricacies of Tetris mechanics  
- experimented with heuristic engineering  
- implemented a metaheuristic weight optimizer  
- built a full beam search evaluation system  

