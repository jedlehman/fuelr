"use client";

import React, { useMemo, useState } from "react";

const DEFAULT_LOG = `Breakfast: banana before BJJ and 30 oz water

Lunch: two grass fed ground beef patties, avocado, smoothie with blueberries, peaches, milk, and whey protein

Snack: 3 baby carrots

Dinner: chili with ground beef, black beans, kidney beans, pinto beans, carrots, broccoli, and cauliflower`;

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

function runScoringTests() {
  const testOne = scoreFood("chicken broccoli blueberries whey bjj", "performance");
  const testTwo = scoreFood("chocolate cake cookies candy", "clean");
  const testThree = scoreFood("beef beans carrots broccoli cauliflower milk whey", "clean");

  return [
    {
      name: "Training day with protein should score strong",
      passed: testOne.total >= 7,
      score: testOne.total
    },
    {
      name: "Sugar heavy day should score lower",
      passed: testTwo.total < 6,
      score: testTwo.total
    },
    {
      name: "Protein plus fiber day should score high",
      passed: testThree.total >= 8,
      score: testThree.total
    }
  ];
}

function ProgressBar({ value, max }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className="h-full rounded-full bg-emerald-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function FuelrApp() {
  const [foodLog, setFoodLog] = useState(DEFAULT_LOG);
  const [goal, setGoal] = useState("performance");
  const [appliedBoosts, setAppliedBoosts] = useState([]);

  const result = useMemo(() => scoreFood(foodLog, goal), [foodLog, goal]);
  const tests = useMemo(() => runScoringTests(), []);

  const boostTotal = appliedBoosts.reduce((sum, item) => sum + item.boost, 0);
  const boostedScore = roundScore(Math.min(10, result.total + boostTotal));
  const availableBoosts = buildBoosts(result.scores).filter((boost) => !appliedBoosts.some((item) => item.title === boost.title));

  function handleFoodChange(event) {
    setFoodLog(event.target.value);
    setAppliedBoosts([]);
  }

  function handleGoalChange(event) {
    setGoal(event.target.value);
    setAppliedBoosts([]);
  }

  function applyBoost(boost) {
    setAppliedBoosts((current) => [...current, boost]);
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-4 text-stone-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-emerald-300">Food judged simply</div>
            <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">Fuelr</h1>
            <p className="mt-3 max-w-2xl text-lg text-stone-400">Get a score for how you ate today. No calorie math. No barcode scanning. Just the truth and one move to improve it.</p>
          </div>
          <button className="rounded-2xl bg-stone-100 px-5 py-4 text-base font-medium text-neutral-950 hover:bg-stone-200">Grade My Day →</button>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl lg:col-span-2">
            <h2 className="text-xl font-medium">What did you eat?</h2>
            <textarea value={foodLog} onChange={handleFoodChange} className="mt-4 min-h-[340px] w-full resize-none rounded-2xl border border-neutral-800 bg-neutral-950 p-4 leading-relaxed text-stone-200 outline-none focus:ring-2 focus:ring-emerald-300" />

            <label className="mt-5 block text-sm text-stone-400">Goal</label>
            <select value={goal} onChange={handleGoalChange} className="mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 text-stone-200 outline-none">
              <option value="performance">Performance</option>
              <option value="clean">Clean Eating</option>
              <option value="fatloss">Fat Loss</option>
              <option value="muscle">Muscle Gain</option>
            </select>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl md:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
                <div>
                  <div className="inline-flex rounded-full bg-emerald-300/10 px-3 py-1 text-sm text-emerald-300">{getLabel(boostedScore)}</div>
                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-8xl font-semibold tracking-tighter md:text-9xl">{boostedScore}</div>
                    <div className="pb-4 text-2xl text-stone-500">/10</div>
                  </div>
                  <p className="mt-4 text-lg text-stone-300">The app rewards protein, whole foods, fiber, smart carb timing, fat control, sugar control, and goal fit.</p>
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
                <h3 className="text-xl font-medium">Food Judgment</h3>
                <p className="mt-4 leading-relaxed text-stone-300">You are not tracking calories. You are grading the quality of the day. The score rewards real food, protein, fiber, smart carb timing, and controlled snacks.</p>
                <div className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-stone-300"><span className="font-medium text-stone-100">One fix:</span> bring up the weakest category with the smallest useful move.</div>
              </div>

              <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
                <h3 className="text-xl font-medium">Quick Boosts</h3>
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

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
              <h3 className="text-xl font-medium">Scoring Tests</h3>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {tests.map((test) => (
                  <div key={test.name} className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className={test.passed ? "text-emerald-300" : "text-red-300"}>{test.passed ? "PASS" : "FAIL"}</div>
                    <div className="mt-2 text-sm text-stone-300">{test.name}</div>
                    <div className="mt-2 text-sm text-stone-500">Score: {test.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
