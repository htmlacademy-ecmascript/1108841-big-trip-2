import { TokenConfig } from '../const.js';

const generateAuthToken = () => `Basic ${Array.from({length: TokenConfig.LENGTH}, () =>
  TokenConfig.CHARACTERS[Math.floor(Math.random() * TokenConfig.CHARACTERS.length)]
).join('')}`;

const isEscapeKey = (evt) => evt.key === 'Escape' || evt.key === 'Esc';

const addKeydownHandler = (handler) => {
  document.addEventListener('keydown', handler);
};

const removeKeydownHandler = (handler) => {
  document.removeEventListener('keydown', handler);
};

const setComponentSaving = (component) => {
  if (component) {
    component.updateElement({
      isDisabled: true,
      isSaving: true
    });
  }
};

const setComponentDeleting = (component) => {
  if (component) {
    component.updateElement({
      isDisabled: true,
      isDeleting: true
    });
  }
};

const setComponentAborting = (component) => {
  if (component) {
    const resetFormState = () => {
      component.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false
      });
    };
    component.shake(resetFormState);
  }
};

export {
  generateAuthToken,
  isEscapeKey,
  addKeydownHandler,
  removeKeydownHandler,
  setComponentSaving,
  setComponentDeleting,
  setComponentAborting
};
