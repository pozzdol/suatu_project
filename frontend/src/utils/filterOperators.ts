interface NumericComparison {
  operator: (value: number, threshold: number) => boolean;
  threshold: number;
}

export const parseNumericFilter = (filterValue: unknown): NumericComparison | null => {
  // Early return if not a string
  if (typeof filterValue !== 'string') return null;

  const operators = {
    '>=': (value: number, threshold: number) => value >= threshold,
    '<=': (value: number, threshold: number) => value <= threshold,
    '>': (value: number, threshold: number) => value > threshold,
    '<': (value: number, threshold: number) => value < threshold,
    '=': (value: number, threshold: number) => value === threshold,
  };

  // Sort operators by length (longest first) to handle >= before > etc.
  const sortedOperators = Object.keys(operators).sort((a, b) => b.length - a.length);

  for (const operator of sortedOperators) {
    if (filterValue.startsWith(operator)) {
      const numericValue = parseFloat(filterValue.slice(operator.length));
      if (!isNaN(numericValue)) {
        return {
          operator: operators[operator as keyof typeof operators],
          threshold: numericValue
        };
      }
    }
  }

  return null;
};