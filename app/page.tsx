"use client";
// @ts-nocheck

import React, { useMemo, useState } from "react";

const categories = [
  { key: "protein", label: "Protein", max: 2 },
  { key: "wholeFoods", label: "Whole Foods", max: 2 },
  { key: "fiber", label: "Veggies & Fiber", max: 2 },
  { key: "carbs", label: "Carb Quality", max: 1.5 },
  { key: "fats", label: "Fat Control", max: 1 },
  { key: "sugar", label: "Sugar Control", max: 1 },
  { key: "goal", label: "Goal Fit", max: 0.5 }
];

const steps = [
  {
    number: "01",
    title: "Enter your meals",
    text: "Type what you ate. Rough portions are fine."
  },
  {
    number: "02",
    title: "Get judged",
    text: "Fuelr scores your day across food quality and balance."
  },
  {
    number: "03",
    title: "Boost the score",
    text: "Get one simple move to improve your day."
  }
];

function roundScore(num) {
  return Math.round(num * 10) / 10;
}

function getLabel(score) {
  if (score >= 9.5) return "Elite Day";
  if (score >= 8.5) return "Strong Day";
  if (score >= 7) return "Solid Day";
  if (score >= 5.5) return "Mixed Day";
  if (score >= 3) return "Poor Day";
  return "Rough Day";
}

function countHits(text, words) {
  return words.filter((word) => text.includes(word)).length;
}

function buildFoodLog(meals) {
  return `Breakfast: ${meals.breakfast}\nLunch: ${meals.lunch}\nDinner: ${meals.dinner}\nSnacks: ${meals.snacks}`;
}

function hasRealFoodInput(meals) {
  return Object.values(meals).join(" ").trim().length > 8;
}

function scoreFood(foodLog, goal) {
  const text = String(foodLog || "").toLowerCase();

  const proteinHits = countHits(text, ["chicken", "beef", "steak", "egg", "eggs", "yogurt", "whey", "fish", "turkey", "protein", "milk", "salmon", "tuna"]);
  const veggieHits = countHits(text, ["broccoli", "cauliflower", "carrot", "spinach", "salad", "pepper", "beans", "black beans", "kidney", "pinto", "vegetables", "asparagus", "kale"]);
  const wholeFoodHits = countHits(text, ["banana", "blueberries", "strawberries", "peaches", "avocado", "rice", "potato", "beef", "chicken", "beans", "milk", "whey", "broccoli", "cauliflower", "carrot", "yogurt", "eggs", "steak"]);
  const sugarHits = countHits(text, ["chocolate", "candy", "cookie", "cookies", "dessert", "ice cream", "syrup", "maple", "pretzel", "cake", "donut", "soda"]);
  const friedHits = countHits(text, ["fries", "fried", "chips", "fast food", "burger", "pizza"]);
  const hasTraining = ["bjj", "workout", "training", "run", "gym", "lift"].some((word) => text.includes(word));

  let scores = {
    protein: proteinHits >= 3 ? 2 : proteinHits === 2 ? 1.6 : proteinHits === 1 ? 1 : 0.25,
    wholeFoods: wholeFoodHits >= 7 ? 2 : wholeFoodHits >= 4 ? 1.5 : wholeFoodHits >= 2 ? 0.9 : 0.2,
    fiber: veggieHits >= 5 ? 2 : veggieHits >= 3 ? 1.5 : veggieHits >= 1 ? 0.8 : 0.1,
    carbs: sugarHits === 0 && hasTraining ? 1.5 : sugarHits === 0 ? 1.2 : sugarHits === 1 ? 0.6 : 0.2,
    fats: friedHits > 0 ? 0.25 : text.includes("avocado") || text.includes("olive") || text.includes("almond") ? 0.85 : 0.75,
    sugar: sugarHits === 0 ? 1 : sugarHits === 1 ? 0.45 : 0.1,
    goal: goal === "performance" && hasTraining ? 0.5 : goal === "clean" && sugarHits === 0 ? 0.5 : 0.25
  };

  let total = Object.values(scores).reduce((sum, value) => sum + value, 0);

  if (friedHits >= 2) total -= 0.8;
  if (sugarHits >= 2) total -= 1.1;
  if (friedHits > 0 && sugarHits > 0) total -= 0.9;

  return { scores, total: roundScore(Math.max(0, Math.min(10, total))) };
}

function buildBoosts(scores) {
  const boosts = [];

  if (scores.fiber < 2) boosts.push({ title: "Add vegetables", detail: "Broccoli, carrots, cauliflower, salad, or beans.", boost: Math.min(0.8, 2 - scores.fiber) });
  if (scores.protein < 2) boosts.push({ title: "Add clean protein", detail: "Whey, Greek yogurt, eggs, chicken, beef, or milk.", boost: Math.min(0.6, 2 - scores.protein) });
  if (scores.sugar < 1) boosts.push({ title: "Protect the night", detail: "Skip sugar plus fat. Choose milk or berries instead.", boost: Math.min(0.7, 1 - scores.sugar) });
  if (scores.carbs < 1.5) boosts.push({ title: "Make carbs useful", detail: "Keep carbs around training or choose fruit, rice, potatoes, or beans.", boost: Math.min(0.5, 1.5 - scores.carbs) });

  return boosts.slice(0, 3);
}

function ProgressBar({ value, max }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-gradient-to-r from-slate-900 to-emerald-500 transition-all duration-700" style={{ width: `${percent}%` }} />
    </div>
  );
}

function MealInput({ label, value, onChange, placeholder }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition focus-within:border-slate-900 focus-within:shadow-md sm:p-5">
      <label className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-slate-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[84px] w-full resize-none bg-transparent text-base leading-relaxed text-slate-950 placeholder:text-slate-300 outline-none sm:min-h-[96px]"
      />
    </div>
  );
}

export default function FuelrApp() {
  const [meals, setMeals] = useState({ breakfast: "", lunch: "", dinner: "", snacks: "" });
  const goal = "performance";
  const [hasGraded, setHasGraded] = useState(false);
  const [appliedBoosts, setAppliedBoosts] = useState([]);
  const [error, setError] = useState("");

  const foodLog = useMemo(() => buildFoodLog(meals), [meals]);
  const result = useMemo(() => scoreFood(foodLog, goal), [foodLog, goal]);
  const boostTotal = appliedBoosts.reduce((sum, item) => sum + item.boost, 0);
  const boostedScore = roundScore(Math.min(10, result.total + boostTotal));
  const availableBoosts = buildBoosts(result.scores).filter((boost) => !appliedBoosts.some((item) => item.title === boost.title));

  function updateMeal(key, value) {
    setMeals((current) => ({ ...current, [key]: value }));
    setHasGraded(false);
    setAppliedBoosts([]);
    setError("");
  }

  function gradeDay() {
    if (!hasRealFoodInput(meals)) {
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
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-5 text-slate-950 sm:px-6 sm:py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-6xl space-y-6 sm:space-y-8">
        <header className="rounded-[2rem] border border-white bg-white/70 px-5 py-8 text-center shadow-sm backdrop-blur-xl sm:px-8 sm:py-10 md:py-12">
          
          <h1 className="text-6xl font-black tracking-[-0.08em] text-slate-950 sm:text-7xl md:text-8xl">Fuelr</h1>
          <p className="mt-3 text-xl font-semibold text-slate-600 sm:text-2xl">Your food, judged.</p>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">{step.number}</div>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-slate-950">{step.title}</h3>
                    <p className="mt-1 text-sm leading-snug text-slate-500">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 sm:p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">What did you eat today?</h2>
              <p className="mt-2 text-sm text-slate-500">Enter each meal below. Keep it simple. Fuelr will do the judging.</p>
            </div>
            <div className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Fresh day</div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <MealInput label="Breakfast" value={meals.breakfast} onChange={(value) => updateMeal("breakfast", value)} placeholder="Example: banana, coffee, Greek yogurt" />
            <MealInput label="Lunch" value={meals.lunch} onChange={(value) => updateMeal("lunch", value)} placeholder="Example: chicken, rice, avocado" />
            <MealInput label="Dinner" value={meals.dinner} onChange={(value) => updateMeal("dinner", value)} placeholder="Example: steak, vegetables, potatoes" />
            <MealInput label="Snacks" value={meals.snacks} onChange={(value) => updateMeal("snacks", value)} placeholder="Example: milk, berries, cookies, chips" />
          </div>

          <div className="mt-6">
            <button
              onClick={gradeDay}
              className="w-full rounded-2xl bg-slate-950 px-8 py-4 text-base font-black text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-emerald-600 active:translate-y-0"
            >
              Grade My Day →
            </button>
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        </section>

        {hasGraded && (
          <section id="results" className="space-y-5 pt-2 sm:space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{getLabel(boostedScore)}</div>
                  <div className="mt-5 flex items-end gap-2">
                    <div className="text-8xl font-black tracking-[-0.08em] text-slate-950 md:text-9xl">{boostedScore}</div>
                    <div className="pb-4 text-2xl font-bold text-slate-300">/10</div>
                  </div>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">This score is based on food quality, protein, vegetables, carb timing, fat control, sugar control, and how well the day matched your goal.</p>
                </div>

                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  {categories.map((category) => {
                    const value = result.scores[category.key];
                    return (
                      <div key={category.key}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-semibold text-slate-700">{category.label}</span>
                          <span className="font-medium text-slate-400">{roundScore(value)} / {category.max}</span>
                        </div>
                        <ProgressBar value={value} max={category.max} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6">
                <h3 className="text-xl font-black text-slate-950">Food Judgment</h3>
                <p className="mt-4 leading-relaxed text-slate-500">You are not tracking calories. You are grading the quality of the day. The score rewards real food, protein, fiber, smart carb timing, and controlled snacks.</p>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-500"><span className="font-black text-slate-950">One fix:</span> bring up the weakest category with the smallest useful move.</div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6">
                <h3 className="text-xl font-black text-slate-950">Quick Boosts</h3>
                {availableBoosts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-700">No obvious boosts left. Protect the score.</div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {availableBoosts.map((boost) => (
                      <button key={boost.title} onClick={() => applyBoost(boost)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-950 hover:bg-white">
                        <div className="flex justify-between gap-3">
                          <div>
                            <div className="font-black text-slate-950">{boost.title}</div>
                            <div className="mt-1 text-sm text-slate-500">{boost.detail}</div>
                          </div>
                          <div className="whitespace-nowrap font-black text-emerald-600">+{roundScore(boost.boost)}</div>
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
