// Recipes and ingredients for The Copper Ladle.
// One clear job: what food exists, what each dish needs, and how new orders appear.

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e23b2e', chopped: true, cooks: false, emoji: '🍅' },
  lettuce: { name: 'Lettuce', color: '#4caf50', chopped: true, cooks: false, emoji: '🥬' },
  bread: { name: 'Bread', color: '#e0a458', chopped: false, cooks: false, emoji: '🍞' },
  cheese: { name: 'Cheese', color: '#ffc93c', chopped: false, cooks: false, emoji: '🧀' },
  patty: { name: 'Patty', color: '#8d4e2a', chopped: false, cooks: true, emoji: '🥩' },
  onion: { name: 'Onion', color: '#f3e5f5', chopped: true, cooks: false, emoji: '🧅' },
};

// An item the chef carries or that sits on the plate: { id, state }.
// state is 'raw', 'chopped' or 'cooked'.
export function makeItem(id, state = 'raw') {
  return { id, state };
}

export function itemNeeds(id, state) {
  return { id, state };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.id].name;
  if (item.state === 'chopped') return `Chopped ${base}`;
  if (item.state === 'cooked') return `Grilled ${base}`;
  return base;
}

export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: [itemNeeds('lettuce', 'chopped'), itemNeeds('tomato', 'chopped')],
    coins: 12,
    blurb: 'Crisp, fresh, fast.',
  },
  {
    id: 'toast',
    name: 'Melty Toast',
    needs: [itemNeeds('bread', 'raw'), itemNeeds('cheese', 'raw'), itemNeeds('tomato', 'chopped')],
    coins: 16,
    blurb: 'Cheese over chopped tomato.',
  },
  {
    id: 'burger',
    name: 'Copper Burger',
    needs: [itemNeeds('bread', 'raw'), itemNeeds('patty', 'cooked'), itemNeeds('lettuce', 'chopped')],
    coins: 20,
    blurb: 'The house favourite.',
  },
  {
    id: 'stack',
    name: 'Onion Stack',
    needs: [itemNeeds('bread', 'raw'), itemNeeds('patty', 'cooked'), itemNeeds('cheese', 'raw'), itemNeeds('onion', 'chopped')],
    coins: 26,
    blurb: 'Four layers, one tower.',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Two items match when ingredient and preparation state both match.
export function itemsMatch(a, b) {
  return a.id === b.id && a.state === b.state;
}

// True when the plate holds exactly the recipe's needs (order does not matter).
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const rest = recipe.needs.slice();
  for (const item of plate) {
    const i = rest.findIndex((n) => itemsMatch(item, n));
    if (i === -1) return false;
    rest.splice(i, 1);
  }
  return true;
}

// True when every plate item belongs to the recipe and nothing extra is on it.
export function plateFitsRecipe(plate, recipe) {
  if (plate.length > recipe.needs.length) return false;
  const rest = recipe.needs.slice();
  for (const item of plate) {
    const i = rest.findIndex((n) => itemsMatch(item, n));
    if (i === -1) return false;
    rest.splice(i, 1);
  }
  return true;
}

// Pick the next recipe: salad, toast and burger from the start (the burger is
// the house dish); the four-layer Onion Stack joins once the shift is rolling.
export function pickRecipe(random, elapsedSeconds) {
  const unlocked = RECIPES.filter((r, i) => elapsedSeconds > 45 || i < 3);
  const weights = unlocked.map((r) => (r.needs.length >= 4 ? 2 : r.id === 'salad' ? 3 : 2));
  let total = 0;
  for (const w of weights) total += w;
  let roll = random() * total;
  for (let i = 0; i < unlocked.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return unlocked[i];
  }
  return unlocked[unlocked.length - 1];
}

export function newOrder(id, recipe, patienceSeconds) {
  return { id, recipeId: recipe.id, patience: patienceSeconds, patienceMax: patienceSeconds };
}
