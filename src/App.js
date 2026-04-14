import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import AutoUpdater from './pages/home/dashboard/AutoUpdater';
import Routers from "./routers";
import { fetchCurrentUserAction } from './stores/redux/auth/authActions';
import { getToken } from "./utils/Token";

function App() {
  const dispatch = useDispatch();
  const token = getToken();

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUserAction());
    }
  }, [dispatch, token]);

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
      <AutoUpdater />
      <Routers />
    </>
  );
}

export default App;
