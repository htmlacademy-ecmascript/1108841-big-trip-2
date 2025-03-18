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
    if (typeof component.setAborting === 'function') {
      component.setAborting();
    } else {
      const resetFormState = () => {
        const { dateFrom, dateTo } = component._state;

        component.updateElement({
          isDisabled: false,
          isSaving: false,
          isDeleting: false,
          dateFrom,
          dateTo
        });

        const form = component.element.querySelector('form');
        if (form) {
          form.classList.remove('disabled');

          const buttons = form.querySelectorAll('button');
          const inputs = form.querySelectorAll('input');
          const selects = form.querySelectorAll('select');

          buttons.forEach((button) => {
            button.removeAttribute('aria-disabled');
            button.disabled = false;
          });

          inputs.forEach((input) => {
            input.removeAttribute('aria-disabled');
            input.disabled = false;
          });

          selects.forEach((select) => {
            select.removeAttribute('aria-disabled');
            select.disabled = false;
          });
        }
      };

      component.shake(resetFormState);
    }
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
