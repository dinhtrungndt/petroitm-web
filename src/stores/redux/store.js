import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from './rootReducer';

let storeInstance;

export const configureStore = () => {
  storeInstance = createStore(rootReducer, applyMiddleware(thunk));
  return storeInstance;
};

export const setStore = (store) => {
  storeInstance = store;
};

export const getStore = () => storeInstance;
