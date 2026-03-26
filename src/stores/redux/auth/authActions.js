import api from '../../../services/api';
import { removeToken, setToken } from '../../../utils/Token';
import {
  FETCH_USER_FAILURE,
  FETCH_USER_REQUEST,
  FETCH_USER_SUCCESS,
  LOGIN_FAILURE,
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGOUT
} from './authTypes';

export const loginAction = (username, password) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const { access_token, user, menus } = response.data;

    setToken(access_token);
    localStorage.setItem('menus', JSON.stringify(menus));

    dispatch({
      type: LOGIN_SUCCESS,
      payload: { user, menus }
    });

    return { success: true };
  } catch (error) {
    const message = error.response?.data?.detail || 'Đăng nhập thất bại';
    dispatch({ type: LOGIN_FAILURE, payload: message });
    return { success: false, message };
  }
};

export const fetchCurrentUserAction = () => async (dispatch) => {
  dispatch({ type: FETCH_USER_REQUEST });
  try {
    const userRes = await api.get('/users/me');

    const storedMenus = JSON.parse(localStorage.getItem('menus') || '[]');

    dispatch({
      type: FETCH_USER_SUCCESS,
      payload: {
        user: userRes.data,
        menus: storedMenus
      }
    });
  } catch (error) {
    dispatch({ type: FETCH_USER_FAILURE });
    removeToken();
    localStorage.removeItem('menus');
  }
};

export const logoutAction = () => (dispatch) => {
  removeToken();
  localStorage.removeItem('menus');
  dispatch({ type: LOGOUT });
};
