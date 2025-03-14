import { TokenConfig } from '../const.js';

const generateAuthToken = () => `Basic ${Array.from({length: TokenConfig.LENGTH}, () =>
  TokenConfig.CHARACTERS[Math.floor(Math.random() * TokenConfig.CHARACTERS.length)]
).join('')}`;

export { generateAuthToken };
