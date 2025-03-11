// Константы
const CharacterConfig = {
  FIRST_CHAR_INDEX: 0,
  SECOND_CHAR_INDEX: 1,
  CHARACTERS: 'abcdefghijklmnopqrstuvwxyz0123456789',
  TOKEN_LENGTH: 12
};

// Функции
function getRandomArrayElement(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalizeFirstLetter(word) {
  if (!word) {
    return '';
  }
  return word[CharacterConfig.FIRST_CHAR_INDEX].toUpperCase() + word.slice(CharacterConfig.SECOND_CHAR_INDEX);
}

const generateAuthToken = () => `Basic ${Array.from({length: CharacterConfig.TOKEN_LENGTH}, () =>
  CharacterConfig.CHARACTERS[Math.floor(Math.random() * CharacterConfig.CHARACTERS.length)]
).join('')}`;

// Экспорты
export { getRandomArrayElement, capitalizeFirstLetter, generateAuthToken };
