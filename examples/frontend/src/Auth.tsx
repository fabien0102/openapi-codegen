import React, { createContext, useContext, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const authContext = createContext<{ token: null | string }>({
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const key = "githubToken";
  const [token, setToken] = useState(localStorage.getItem(key));
  const [draftToken, setDraftToken] = useState("");
  const queryClient = useQueryClient();

  return (
    <authContext.Provider value={{ token }}>
      {token ? (
        <>
          {children}
          <button
            onClick={() => {
              setToken(null);
              localStorage.removeItem(key);
              queryClient.clear();
            }}
          >
            Disconnect
          </button>
        </>
      ) : (
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setToken(draftToken);
              localStorage.setItem(key, draftToken);
            }}
          >
            <p>Please enter a personal access token</p>
            <input
              value={draftToken}
              onChange={(e) => setDraftToken(e.target.value)}
            ></input>
          </form>
        </div>
      )}
    </authContext.Provider>
  );
}

export const useToken = () => {
  const { token } = useContext(authContext);

  return token;
};
