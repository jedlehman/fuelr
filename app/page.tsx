"use client";
// @ts-nocheck

import React, { useMemo, useState } from "react";

const EMPTY_LOG = `Breakfast:

Lunch:

Dinner:

Snacks:`;

const categories = [
  { key: "protein", label: "Protein", max: 2 },
  { key: "wholeFoods", label: "Whole Foods", max: 2 },
  { key: "fiber", label: "Veggies & Fiber", max: 2 },
  { key: "carbs", label: "Carb Quality", max: 1.5 },
  { key: "fats", label: "Fat Control", max: 1 },
  { key: "sugar", label: "Sugar Control", max: 1 },
  { key: "goal", label: "Goal Fit", max: 0.5 }
];

function roundScore(num) {
  return Math.round(num * 10) / 10;
}

function getLabel(score) {
  if (score >= 9.5) return "Elite Day";
  if (score >= 8.5) return "Strong Day";
  if (score >= 7) return "Solid Day";
  if (score >= 5.5) return "Needs Work";
  return "Off Track";
}

function countHits(text, words) {
  return words.filter((word) => text.includes(word)).length;
}

function hasRealFoodInput(foodLog) {
  const cleaned = String(foodLog || "")
    .toLowerCase()
    .replace(/breakfast:/g, "")
    .replace(/lunch:/g, "")
    .replace(/dinner:/g, "")
    .replace(/snacks:/g, "")
    .trim();

  return cleaned.length > 8;
}

function scoreFood(foodLog, goal) {
  const text = String(foodLog || "").toLowerCase();

  const proteinHits = countHits(text, ["chicken", "beef", "steak", "egg", "eggs", "yogurt", "whey", "fish", "turkey", "protein", "milk"]);
  const veggieHits = countHits(text, ["broccoli", "cauliflower", "carrot", "spinach", "salad", "pepper", "beans", "black beans", "kidney", "pinto", "vegetables"]);
  const wholeFoodHits = countHits(text, ["banana", "blueberries", "strawberries", "peaches", "avocado", "rice", "potato", "beef", "chicken", "beans", "milk", "whey", "broccoli", "cauliflower", "carrot", "yogurt"]);
  const sugarHits = countHits(text, ["chocolate", "candy", "cookie", "cookies", "dessert", "ice cream", "syrup", "maple", "pretzel", "cake"]);
  const friedHits = countHits(text, ["fries", "fried", "chips"]);
  const hasTraining = ["bjj", "workout", "training", "run", "gym", "lift"].some((word) => text.includes(word));

  const scores = {
    protein: proteinHits >= 3 ? 2 : proteinHits === 2 ? 1.6 : proteinHits === 1 ? 1 : 0.4,
    wholeFoods: wholeFoodHits >= 7 ? 2 : wholeFoodHits >= 4 ? 1.6 : wholeFoodHits >= 2 ? 1 : 0.5,
    fiber: veggieHits >= 5 ? 2 : veggieHits >= 3 ? 1.6 : veggieHits >= 1 ? 1 : 0.3,
    carbs: sugarHits === 0 && hasTraining ? 1.5 : sugarHits <= 1 ? 1.1 : 0.6,
    fats: friedHits > 0 ? 0.55 : text.includes("avocado") || text.includes("olive") || text.includes("almond") ? 0.85 : 1,
    sugar: sugarHits === 0 ? 1 : sugarHits === 1 ? 0.7 : 0.35,
    goal: goal === "performance" && hasTraining ? 0.5 : goal === "clean" && sugarHits === 0 ? 0.5 : 0.35
  };

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  return { scores, total: roundScore(Math.min(10, total)) };
}

function buildBoosts(scores) {
  const boosts = [];

  if (scores.fiber < 2) {
    boosts.push({ title: "Add a real vegetable serving", detail: "Broccoli, carrots, cauliflower, salad, or beans.", boost: Math.min(0.8, 2 - scores.fiber), category: "fiber" });
  }

  if (scores.protein < 2) {
    boosts.push({ title: "Add a clean protein hit", detail: "Whey, Greek yogurt, eggs, chicken, beef, or milk.", boost: Math.min(0.6, 2 - scores.protein), category: "protein" });
  }

  if (scores.sugar < 1) {
    boosts.push({ title: "Protect the night", detail: "Skip the sugar plus fat combo and choose milk or berries instead.", boost: Math.min(0.7, 1 - scores.sugar), category: "sugar" });
  }

  if (scores.carbs < 1.5) {
    boosts.push({ title: "Make carbs useful", detail: "Keep carbs around training or choose fruit, rice, potatoes, or beans.", boost: Math.min(0.5, 1.5 - scores.carbs), category: "carbs" });
  }

  return boosts.slice(0, 3);
}

function ProgressBar({ value, max }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className="h-full rounded-full bg-emerald-300 transition-all duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function FuelrApp() {
  const [foodLog, setFoodLog] = useState(EMPTY_LOG);
  const [goal, setGoal] = useState("performance");
  const [hasGraded, setHasGraded] = useState(false);
  const [appliedBoosts, setAppliedBoosts] = useState([]);
  const [error, setError] = useState("");

  const result = useMemo(() => scoreFood(foodLog, goal), [foodLog, goal]);
  const boostTotal = appliedBoosts.reduce((sum, item) => sum + item.boost, 0);
  const boostedScore = roundScore(Math.min(10, result.total + boostTotal));
  const availableBoosts = buildBoosts(result.scores).filter((boost) => !appliedBoosts.some((item) => item.title === boost.title));

  function handleFoodChange(event) {
    setFoodLog(event.target.value);
    setHasGraded(false);
    setAppliedBoosts([]);
    setError("");
  }

  function handleGoalChange(event) {
    setGoal(event.target.value);
    setHasGraded(false);
    setAppliedBoosts([]);
    setError("");
  }

  function gradeDay() {
    if (!hasRealFoodInput(foodLog)) {
      setError("Add what you ate first, then Fuelr will grade your day.");
      return;
    }

    setError("");
    setHasGraded(true);

    setTimeout(() => {
      const results = document.getElementById("results");
      if (results) results.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function applyBoost(boost) {
    setAppliedBoosts((current) => [...current, boost]);
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-4 text-stone-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="pt-4 text-center md:pt-10">
          <h1 className="mt-4 text-6xl font-black tracking-tight md:text-8xl">Fuelr</h1>
          <p className="mt-3 text-lg text-stone-300 md:text-xl">Your food, judged.</p>
        </header>

        <section className="mx-auto max-w-3xl rounded-[2rem] border border-neutral-800 bg-neutral-900/80 p-5 shadow-2xl md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">What did you eat today?</h2>
              <p className="mt-2 text-sm text-stone-500">Type it naturally. Rough portions are fine.</p>
            </div>
            <div className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm text-stone-400">Fresh day</div>
          </div>

          <textarea
            value={foodLog}
            onChange={handleFoodChange}
            className="mt-6 min-h-[300px] w-full resize-none rounded-3xl border border-neutral-800 bg-neutral-950 p-5 text-lg leading-relaxed text-stone-200 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
          />

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="block text-sm text-stone-400">Goal</label>
              <select value={goal} onChange={handleGoalChange} className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-stone-200 outline-none focus:border-emerald-300">
                <option value="performance">Performance</option>
                <option value="clean">Clean Eating</option>
                <option value="fatloss">Fat Loss</option>
                <option value="muscle">Muscle Gain</option>
              </select>
            </div>

            <button
              onClick={gradeDay}
              className="rounded-2xl bg-stone-100 px-8 py-4 text-base font-bold text-neutral-950 shadow-lg shadow-emerald-300/10 transition hover:bg-emerald-300"
            >
              Grade My Day →
            </button>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
        </section>

        {!hasGraded && (
          <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-sm text-emerald-300">01</div>
              <h3 className="mt-3 text-xl font-semibold">Enter your meals</h3>
              <p className="mt-2 text-stone-500">No tracking. No measuring. Just type what you ate.</p>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-sm text-emerald-300">02</div>
              <h3 className="mt-3 text-xl font-semibold">Get judged</h3>
              <p className="mt-2 text-stone-500">Fuelr grades protein, whole foods, fiber, carbs, fats, and sugar.</p>
            </div>
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="text-sm text-emerald-300">03</div>
              <h3 className="mt-3 text-xl font-semibold">Boost the score</h3>
              <p className="mt-2 text-stone-500">Get one quick move that can improve your day right now.</p>
            </div>
          </section>
        )}

        {hasGraded && (
          <section id="results" className="space-y-6 pt-4">
            <div className="rounded-[2rem] border border-neutral-800 bg-neutral-900 p-6 shadow-2xl md:p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <div className="inline-flex rounded-full bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-300">{getLabel(boostedScore)}</div>
                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-8xl font-black tracking-tighter md:text-9xl">{boostedScore}</div>
                    <div className="pb-4 text-2xl text-stone-500">/10</div>
                  </div>
                  <p className="mt-4 max-w-xl text-lg text-stone-300">This score is based on food quality, protein, vegetables, carb timing, fat control, sugar control, and how well the day matched your goal.</p>
                </div>

                <div className="space-y-3">
                  {categories.map((category) => {
                    const value = result.scores[category.key];
                    return (
                      <div key={category.key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-stone-300">{category.label}</span>
                          <span className="text-stone-500">{roundScore(value)} / {category.max}</span>
                        </div>
                        <ProgressBar value={value} max={category.max} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
                <h3 className="text-xl font-semibold">Food Judgment</h3>
                <p className="mt-4 leading-relaxed text-stone-300">You are not tracking calories. You are grading the quality of the day. The score rewards real food, protein, fiber, smart carb timing, and controlled snacks.</p>
                <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-stone-300"><span className="font-medium text-stone-100">One fix:</span> bring up the weakest category with the smallest useful move.</div>
              </div>

              <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
                <h3 className="text-xl font-semibold">Quick Boosts</h3>
                {availableBoosts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-200">No obvious boosts left. Protect the score.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {availableBoosts.map((boost) => (
                      <button key={boost.title} onClick={() => applyBoost(boost)} className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left transition hover:border-emerald-300/60">
                        <div className="flex justify-between gap-3">
                          <div>
                            <div className="font-medium text-stone-100">{boost.title}</div>
                            <div className="mt-1 text-sm text-stone-500">{boost.detail}</div>
                          </div>
                          <div className="whitespace-nowrap font-semibold text-emerald-300">+{roundScore(boost.boost)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
