import { createContext, useContext, useState, ReactNode } from "react";

interface AIButtonContextType {
  hideGlobalButton: boolean;
  setHideGlobalButton: (hide: boolean) => void;
}

const AIButtonContext = createContext<AIButtonContextType>({
  hideGlobalButton: false,
  setHideGlobalButton: () => {},
});

export function AIButtonProvider({ children }: { children: ReactNode }) {
  const [hideGlobalButton, setHideGlobalButton] = useState(false);

  return (
    <AIButtonContext.Provider value={{ hideGlobalButton, setHideGlobalButton }}>
      {children}
    </AIButtonContext.Provider>
  );
}

export function useAIButton() {
  return useContext(AIButtonContext);
}
