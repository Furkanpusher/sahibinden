import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const CompareContext = createContext();

const STORAGE_KEY = "sahibinden_compare_items";
const TYPE_KEY = "sahibinden_compare_type";
const MAX_COMPARE_LIMIT = 4;

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [compareType, setCompareType] = useState(() => {
    try {
      return localStorage.getItem(TYPE_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
      if (compareItems.length === 0) {
        localStorage.removeItem(TYPE_KEY);
        setCompareType(null);
      } else if (compareType) {
        localStorage.setItem(TYPE_KEY, compareType); // for now it's in localstorage I guess it's fine
      }
    } catch (e) {
      console.error("Compare storage error:", e);
    }
  }, [compareItems, compareType]);

  const addToCompare = (item, type) => {
    if (compareItems.some((i) => i.id === item.id)) {
      toast.info("Bu ilan zaten karşılaştırma listesinde.");
      return;
    }

    if (compareType && compareType !== type) {
      toast.warning(
        `Farklı kategorideki ilanları karşılaştıramazsınız. Şu an "${compareType === "car" ? "Araç" : "Konut"
        }" listesi seçili.`
      );
      return;
    }

    if (compareItems.length >= MAX_COMPARE_LIMIT) {
      toast.warning(`En fazla ${MAX_COMPARE_LIMIT} ilan karşılaştırabilirsiniz.`);
      return;
    }

    setCompareItems((prev) => [...prev, item]);
    setCompareType(type);
    toast.success("İlan karşılaştırma listesine eklendi.");
  };

  const removeFromCompare = (id) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCompare = () => {
    setCompareItems([]);
    setCompareType(null);
  };

  const isInCompare = (id) => {
    return compareItems.some((item) => item.id === id);
  };

  const toggleCompare = (item, type) => {
    if (isInCompare(item.id)) {
      removeFromCompare(item.id);
    } else {
      addToCompare(item, type);
    }
  };

  return (
    <CompareContext.Provider
      value={{
        compareItems,
        compareType,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        toggleCompare,
        maxLimit: MAX_COMPARE_LIMIT,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
}
