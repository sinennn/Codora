import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContainer
        position={window.innerWidth < 768 ? "top-center" : "bottom-right"}
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{
          top: window.innerWidth < 768 ? '1rem' : undefined,
          bottom: window.innerWidth >= 768 ? '1rem' : undefined,
        }}
      />
      {children}
    </>
  );
}

export { toast };