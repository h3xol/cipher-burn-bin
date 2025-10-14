export const hasConsent = (): boolean => {
  const consent = localStorage.getItem("cookie-consent");
  return consent === "accepted";
};

export const canUseStorage = (): boolean => {
  // Allow storage for consent itself, or if already accepted
  return hasConsent();
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (key === "cookie-consent") return localStorage.getItem(key);
    return canUseStorage() ? localStorage.getItem(key) : null;
  },
  
  setItem: (key: string, value: string): void => {
    if (key === "cookie-consent") {
      localStorage.setItem(key, value);
      return;
    }
    if (canUseStorage()) {
      localStorage.setItem(key, value);
    }
  },
  
  removeItem: (key: string): void => {
    if (canUseStorage() || key === "cookie-consent") {
      localStorage.removeItem(key);
    }
  }
};
