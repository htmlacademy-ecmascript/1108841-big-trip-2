import { RenderPosition, createElement, replace, remove } from '../framework/render.js';
import { render as renderOriginal } from '../framework/render.js';
export const render = (component, container, place = 'beforeend') => {
  renderOriginal(component, container, place);
};
export { RenderPosition, createElement, replace, remove };
