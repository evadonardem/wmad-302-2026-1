import {
  displayName,
  formatQuantity,
  formatSeconds,
  ingredientKey,
  parseDurationMinutes,
  parseIngredient,
  scaleIngredient,
} from '../ingredients';

describe('parseIngredient', () => {
  it('reads whole numbers, fractions and mixed numbers', () => {
    expect(parseIngredient('2 cups flour')).toEqual({ quantity: 2, quantityMax: null, rest: 'cups flour' });
    expect(parseIngredient('1/2 teaspoon salt').quantity).toBe(0.5);
    expect(parseIngredient('1 1/2 cups milk').quantity).toBe(1.5);
    expect(parseIngredient('½ cup sugar').quantity).toBe(0.5);
    expect(parseIngredient('1.5 kg potatoes').quantity).toBe(1.5);
  });

  it('reads ranges like "2-3 cloves"', () => {
    expect(parseIngredient('2-3 cloves garlic')).toEqual({ quantity: 2, quantityMax: 3, rest: 'cloves garlic' });
  });

  it('returns null quantity when there is no amount', () => {
    expect(parseIngredient('Fresh basil leaves')).toEqual({
      quantity: null,
      quantityMax: null,
      rest: 'Fresh basil leaves',
    });
  });
});

describe('formatQuantity', () => {
  it('shows common fractions', () => {
    expect(formatQuantity(0.5)).toBe('1/2');
    expect(formatQuantity(0.33)).toBe('1/3');
    expect(formatQuantity(2.75)).toBe('2 3/4');
  });

  it('shows whole numbers and rounds up near-whole values', () => {
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(1.99)).toBe('2');
  });

  it('falls back to one decimal for unusual amounts', () => {
    expect(formatQuantity(0.4)).toBe('0.4');
  });

  it('never shows negative amounts', () => {
    expect(formatQuantity(-1)).toBe('0');
  });
});

describe('scaleIngredient', () => {
  it('scales the amount and keeps the rest', () => {
    expect(scaleIngredient('2 cups rice', 2)).toBe('4 cups rice');
    expect(scaleIngredient('1/2 teaspoon salt', 2)).toBe('1 teaspoon salt');
  });

  it('uses the singular unit when the amount drops to one or less', () => {
    expect(scaleIngredient('2 cups all-purpose flour', 0.5)).toBe('1 cup all-purpose flour');
  });

  it('scales both ends of a range', () => {
    expect(scaleIngredient('2-3 cloves garlic, minced', 2)).toBe('4-6 cloves garlic, minced');
  });

  it('leaves lines without an amount unchanged', () => {
    expect(scaleIngredient('Salt to taste', 3)).toBe('Salt to taste');
  });

  it('returns the original text when the factor is 1', () => {
    expect(scaleIngredient('1 1/2 cups milk', 1)).toBe('1 1/2 cups milk');
  });
});

describe('ingredientKey', () => {
  it('removes amounts, units and preparation words', () => {
    expect(ingredientKey('2 tablespoons Olive Oil, divided')).toBe('olive oil');
    expect(ingredientKey('1 large onion, finely chopped')).toBe('onion');
    expect(ingredientKey('4 boneless, skinless chicken breasts')).toBe('chicken breast');
    expect(ingredientKey('1 can (14 oz) coconut milk')).toBe('coconut milk');
  });

  it('gives the same key for the same ingredient written differently', () => {
    expect(ingredientKey('1/4 cup olive oil')).toBe(ingredientKey('3 tablespoons olive oil'));
  });

  it('ignores simple plurals so the same ingredient merges', () => {
    expect(ingredientKey('2 onions')).toBe('onion');
    expect(ingredientKey('3 ripe tomatoes, diced')).toBe('tomato');
    expect(ingredientKey('1 cup mixed berries')).toBe('mixed berry');
    expect(ingredientKey('1/2 cup hummus')).toBe('hummus');
  });
});

describe('displayName', () => {
  it('capitalizes the first letter', () => {
    expect(displayName('olive oil')).toBe('Olive oil');
    expect(displayName('')).toBe('');
  });
});

describe('parseDurationMinutes', () => {
  it('finds minutes and hours in a step', () => {
    expect(parseDurationMinutes('Bake for 25 minutes until golden.')).toBe(25);
    expect(parseDurationMinutes('Cook for 1 hour, stirring.')).toBe(60);
    expect(parseDurationMinutes('Let rest 1.5 hours')).toBe(90);
    expect(parseDurationMinutes('Fry for 3 mins')).toBe(3);
  });

  it('uses the longer time of a range', () => {
    expect(parseDurationMinutes('Simmer for 10-15 minutes')).toBe(15);
    expect(parseDurationMinutes('Bake 20 to 25 mins')).toBe(25);
  });

  it('returns null when the step has no time', () => {
    expect(parseDurationMinutes('Season with salt and pepper.')).toBeNull();
  });
});

describe('formatSeconds', () => {
  it('formats as m:ss or h:mm:ss', () => {
    expect(formatSeconds(90)).toBe('1:30');
    expect(formatSeconds(5)).toBe('0:05');
    expect(formatSeconds(3725)).toBe('1:02:05');
    expect(formatSeconds(-10)).toBe('0:00');
  });
});
