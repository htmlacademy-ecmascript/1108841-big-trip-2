const FIRST_CHAR_INDEX = 0;
const SECOND_CHAR_INDEX = 1;

function getRandomArrayElement(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalizeFirstLetter(word) {
  if (!word) {
    return '';
  }
  return word[FIRST_CHAR_INDEX].toUpperCase() + word.slice(SECOND_CHAR_INDEX);
}

export const generateAuthToken = () => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 12;
  return 'Basic ' + Array.from({length}, () =>
    characters[Math.floor(Math.random() * characters.length)]
  ).join('');
};

export { getRandomArrayElement, capitalizeFirstLetter };
