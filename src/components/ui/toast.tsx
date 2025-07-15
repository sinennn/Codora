import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        pauseOnHover
        theme="dark"
        style={{
          top: "2%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 5000,
        }}
        toastStyle={{
          borderRadius: "0.5rem",
          maxWidth: "80%",
          margin: "0 auto",
          background: "#1a1a1a",
          border: "1px solid #333",
          color: "#fff",
          padding: "12px 16px",
        }}
      />
      {children}
    </>
  );
}

export { toast };
