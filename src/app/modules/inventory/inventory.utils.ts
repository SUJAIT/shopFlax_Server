export function generateSKU(
  productName: string,
  modelCode: string
): string {
  const product = productName
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();

  const model = modelCode.trim().toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `${product}-${model}-${random}`;
}
