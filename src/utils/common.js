import { ArrayConfig, TokenConfig } from '../const.js';


function getRandomArrayElement(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalizeFirstLetter(word) {
  if (!word) {
    return '';
  }
  return word[ArrayConfig.FIRST_INDEX].toUpperCase() + word.slice(ArrayConfig.SECOND_INDEX);
}

const generateAuthToken = () => `Basic ${Array.from({length: TokenConfig.LENGTH}, () =>
  TokenConfig.CHARACTERS[Math.floor(Math.random() * TokenConfig.CHARACTERS.length)]
).join('')}`;


export { getRandomArrayElement, capitalizeFirstLetter, generateAuthToken };
