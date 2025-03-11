import { ArrayConfig, TokenConfig } from '../const.js';

// Функции
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

// Экспорты
export { getRandomArrayElement, capitalizeFirstLetter, generateAuthToken };
