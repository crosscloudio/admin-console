/**
 * utils for getting and generating colors in the UI
 */
import randomColor from 'randomcolor';

// default CI colors
const CI_COLORS = [
  'rgba(2,222,135,1)',
  'rgba(84,53,171,1)',
  'rgba(18,115,255,1)',
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#D35400',
  '#00B16A',
  '#CF000F',
];

/**
 * returns an array of random colors of amount
 * @param amount the amount of random colors to generate
 */
export function getRandomColors(amount) {
  return randomColor({
    count: amount,
    format: 'rgba',
    luminosity: 'bright',
    alpha: 1,
  });
}

/**
 * returns an array of colors of amount to use in charts
 * This is a combination of ci-colors extended with random colors (if required)
 * @param amount the amount of colors required
 */
export function getChartColors(amount) {
  // if CI colors are sufficient
  if (amount <= CI_COLORS.length) {
    return CI_COLORS.slice(0, amount);
  }

  // generating delta of CI colors and amount
  const randomlyGenerated = getRandomColors(CI_COLORS.length - amount);
  return CI_COLORS.concat(randomlyGenerated);
}
