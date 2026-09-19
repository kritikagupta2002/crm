/* Indian-style short amounts: ₹85K, ₹4.5 L, ₹1.2 Cr */
export function formatINR(amount) {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(1).replace(/\.0$/, '')} Cr`
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1).replace(/\.0$/, '')} L`
  if (amount >= 1e3) return `₹${Math.round(amount / 1e3)}K`
  return `₹${amount}`
}
