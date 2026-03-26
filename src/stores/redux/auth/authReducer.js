import { getToken } from '../../../utils/Token';
import { FETCH_USER_FAILURE, FETCH_USER_REQUEST, FETCH_USER_SUCCESS, LOGIN_FAILURE, LOGIN_REQUEST, LOGIN_SUCCESS, LOGOUT } from './authTypes';

const initialState = {
  isAuthenticated: false,
  user: null,
  menus: [],
  loading: !!getToken(),
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
    case FETCH_USER_REQUEST:
      return { ...state, loading: true, error: null };

    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        menus: action.payload.menus,
      };

    case FETCH_USER_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        menus: action.payload.menus || [],
        loading: false,
      };

    case LOGIN_FAILURE:
    case FETCH_USER_FAILURE:
      return { ...state, loading: false, error: action.payload, isAuthenticated: false };

    case LOGOUT:
      return { ...initialState, loading: false };

    default:
      return state;
  }
};

export default authReducer;
