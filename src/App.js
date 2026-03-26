import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import Routers from "./routers";
import { fetchCurrentUserAction } from './stores/redux/auth/authActions';
import { getToken } from "./utils/Token";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getToken();
    if (token) {
      dispatch(fetchCurrentUserAction());
    }
  }, [dispatch]);

  return (
    <>
      <Toaster
        position="top-right"
        containerStyle={{
          top: 20,
          right: 20,
          zIndex: 999999,
        }}
        toastOptions={{
          style: {
            zIndex: 999999,
          },
        }}
      />
      <Routers />
    </>
  );
}

export default App;
