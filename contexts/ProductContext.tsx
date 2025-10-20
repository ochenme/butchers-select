import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../types";
import { 
  fetchProducts, 
  addProduct as addProductToSheet, 
  updateProduct as updateProductInSheet, 
  deleteProduct as deleteProductFromSheet 
} from "../services/geminiService";

// 簡單 UUID 產生器
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const PRODUCTS_CACHE_KEY = 'fengyu_products_cache';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (productData: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化時讀取資料
  useEffect(() => {
    const loadProducts = async () => {
      // Step 1: Immediately load from localStorage if available for faster perceived load times
      try {
        const cachedProductsJSON = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cachedProductsJSON) {
          const cachedProducts = JSON.parse(cachedProductsJSON);
          setProducts(cachedProducts);
          setLoading(false); // We have something to show, so stop initial loading state
        }
      } catch (e) {
        console.error("Failed to load products from localStorage", e);
      }

      // Step 2: Fetch fresh data from the network
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
        // Step 3: Update localStorage with fresh data
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(fetchedProducts));
      } catch (err) {
        console.error(err);
        // Only set an error if we have no products to display at all (not even from cache)
        if (products.length === 0) {
            setError("無法載入商品資料");
        }
      } finally {
        // Ensure loading is always set to false after the fetch attempt,
        // especially for the first load where cache might be empty.
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // ✅ 新增商品（會同步寫入 Google Sheet 並更新快取）
  const addProduct = async (productData: Omit<Product, "id">) => {
    const newProduct: Product = { ...productData, id: generateUUID() };
    setProducts((prev) => {
        const updatedProducts = [...prev, newProduct];
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
        return updatedProducts;
    });
    await addProductToSheet(newProduct);
  };

  // ✅ 更新商品（會同步寫入 Google Sheet 並更新快取）
  const updateProduct = async (updatedProduct: Product) => {
    setProducts((prev) => {
        const updatedProducts = prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
        return updatedProducts;
    });
    await updateProductInSheet(updatedProduct);
  };

  // ✅ 刪除商品（會同步寫入 Google Sheet 並更新快取）
  const deleteProduct = async (productId: string) => {
    if (!window.confirm("確定要刪除此商品嗎？")) return;
    setProducts((prev) => {
        const updatedProducts = prev.filter((p) => p.id !== productId);
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updatedProducts));
        return updatedProducts;
    });
    await deleteProductFromSheet(productId);
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
