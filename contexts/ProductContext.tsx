import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../types";
import {
  fetchProducts,
  addProduct as addProductToFirestore,
  updateProduct as updateProductInFirestore,
  deleteProduct as deleteProductFromFirestore,
} from "../services/geminiService";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const PRODUCTS_CACHE_KEY = "fengyu_products_cache";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (productData: Omit<Product, "id">) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化時讀取資料
  useEffect(() => {
    const loadProducts = async () => {
      let cachedProducts: Product[] | null = null;

      if (typeof window !== "undefined") {
        try {
          const cachedProductsJSON = window.localStorage.getItem(PRODUCTS_CACHE_KEY);
          if (cachedProductsJSON) {
            cachedProducts = JSON.parse(cachedProductsJSON) as Product[];
            setProducts(cachedProducts);
            setLoading(false);
          }
        } catch (storageError) {
          console.error("Failed to load products from localStorage", storageError);
        }
      }

      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
        setError(null);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(fetchedProducts));
        }
      } catch (err) {
        console.error(err);
        if (!cachedProducts || cachedProducts.length === 0) {
          setError("無法載入商品資料");
        }
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const updateLocalCache = (nextProducts: Product[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(nextProducts));
    } catch (storageError) {
      console.error("Failed to update product cache", storageError);
    }
  };

  // ✅ 新增商品（會同步寫入 Firestore 並更新快取）
  const addProduct = async (productData: Omit<Product, "id">): Promise<void> => {
    const newProduct: Product = { ...productData, id: generateUUID() };
    try {
      await addProductToFirestore(newProduct);
      setProducts((prev) => {
        const updatedProducts = [...prev, newProduct];
        updateLocalCache(updatedProducts);
        return updatedProducts;
      });
      setError(null);
    } catch (err) {
      console.error("Failed to add product", err);
      setError("新增商品時發生錯誤");
      throw err;
    }
  };

  // ✅ 更新商品（會同步寫入 Firestore 並更新快取）
  const updateProduct = async (updatedProduct: Product): Promise<void> => {
    try {
      await updateProductInFirestore(updatedProduct);
      setProducts((prev) => {
        const updatedProducts = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
        updateLocalCache(updatedProducts);
        return updatedProducts;
      });
      setError(null);
    } catch (err) {
      console.error("Failed to update product", err);
      setError("更新商品時發生錯誤");
      throw err;
    }
  };

  // ✅ 刪除商品（會同步寫入 Firestore 並更新快取）
  const deleteProduct = async (productId: string): Promise<void> => {
    try {
      await deleteProductFromFirestore(productId);
      setProducts((prev) => {
        const updatedProducts = prev.filter((p) => p.id !== productId);
        updateLocalCache(updatedProducts);
        return updatedProducts;
      });
      setError(null);
    } catch (err) {
      console.error("Failed to delete product", err);
      setError("刪除商品時發生錯誤");
      throw err;
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, addProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
