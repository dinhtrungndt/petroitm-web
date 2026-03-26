import api from '../../../services/api';
import { removeToken, setToken } from '../../../utils/Token';
import {
  FETCH_USER_SUCCESS, LOGIN_FAILURE, LOGIN_REQUEST,
  LOGIN_SUCCESS, LOGOUT
} from './authTypes';

export const loginAction = (username, password) => async (dispatch) => {
  dispatch({ type: LOGIN_REQUEST });
  try {
    // FastAPI OAuth2PasswordRequestForm yêu cầu gửi dưới dạng Form Data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const { access_token, user, menus } = response.data;

    // Lưu token vào localStorage (đã mã hóa qua utils)
    setToken(access_token);

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
  try {
    const response = await api.get('/users/me');
    dispatch({ type: FETCH_USER_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch(logoutAction());
  }
};

export const logoutAction = () => (dispatch) => {
  removeToken();
  dispatch({ type: LOGOUT });
};
