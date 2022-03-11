export default function separateDecimals (x: number): string {

  const negative = x < 0;
  const chars = Array.from(String(Math.abs(x)));

  for (let i = chars.length - 3; i > 0; i -= 3) {
    chars.splice(i, 0, '.');
  }

  return (negative ? '-' : '') + chars.join('');

};
