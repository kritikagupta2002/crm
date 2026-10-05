/* Indian-style short amounts: ₹85K, ₹4.5 L, ₹1.2 Cr */
export function formatINR(amount) {
  // Very large crore figures keep Indian digit grouping (₹6,00,000 Cr), so they stay readable.
  if (amount >= 1e7) return `₹${(amount / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 1 })} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (amount >= 1e3) return `₹${Math.round(amount / 1e3)}K`
  return `₹${amount}`
}
