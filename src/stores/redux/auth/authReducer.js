import {
  FETCH_USER_SUCCESS, LOGIN_FAILURE, LOGIN_REQUEST,
  LOGIN_SUCCESS, LOGOUT
} from './authTypes';

const initialState = {
  isAuthenticated: false,
  user: null,
  menus: [],
  loading: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
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
        user: action.payload,
        loading: false,
      };
    case LOGIN_FAILURE:
      return { ...state, loading: false, error: action.payload };
    case LOGOUT:
      return { ...initialState };
    default:
      return state;
  }
};

export default authReducer;
