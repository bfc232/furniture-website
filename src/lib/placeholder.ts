export function placeholderSvg(label: string, accent = "#8A5A3B") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" fill="none">
  <rect width="1200" height="900" fill="#EFE7DC"/>
  <rect x="120" y="140" width="960" height="620" rx="48" fill="#F7F1E8" stroke="#D9CBB8"/>
  <circle cx="300" cy="320" r="80" fill="${accent}" opacity="0.25"/>
  <rect x="420" y="430" width="520" height="28" rx="14" fill="#CDBBA6"/>
  <rect x="420" y="480" width="360" height="18" rx="9" fill="#DDD0BF"/>
  <text x="600" y="780" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="#6E5B4A">${label}</text>
  <text x="600" y="820" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#8A7A6A">Sample placeholder — replace with product photo</text>
</svg>`;
}
