import { RouteContext } from "@gadgetinc/api-client-core";

export default async function route({ reply }: RouteContext) {
  // SVG content for ShareAByteLogo
  const svgContent = `
<svg width="1500" height="600" viewBox="0 0 1500 600" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Circle with border -->
  <circle cx="100" cy="100" r="80" fill="white" stroke="#16a34a" stroke-width="5"/>
  
  <!-- Fork icon -->
  <path d="M100 40C93 40 87.5 45.5 87.5 52.5C87.5 57.5 90.5 61.5 95 63.5V75C95 75 95 77.5 90 77.5C80 77.5 70 87.5 70 87.5V92.5H88.75C88.75 92.5 90 100 96.25 100H103.75C110 100 111.25 92.5 111.25 92.5H130V87.5C130 87.5 120 77.5 110 77.5C105 77.5 105 75 105 75V63.5C109.5 61.5 112.5 57.5 112.5 52.5C112.5 45.5 107 40 100 40Z M100 52.5C100 55 97.5 57.5 95 57.5C92.5 57.5 90 55 90 52.5C90 50 92.5 47.5 95 47.5C97.5 47.5 100 50 100 52.5Z M100 105V160M80 120H120" stroke="#16a34a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- ShareAByte text -->
  <text x="210" y="90" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#16a34a">Share<tspan fill="#f59e0b">A</tspan>Byte</text>
  
  <!-- Tagline -->
  <text x="210" y="120" font-family="Arial, sans-serif" font-size="20" fill="#16a34a">Share food, reduce waste</text>
</svg>
`;

  // Set headers for SVG download
  reply.header('Content-Type', 'image/svg+xml');
  reply.header('Content-Disposition', 'attachment; filename="shareabye-logo-large.svg"');
  
  // Send the SVG content
  await reply.send(svgContent);
}