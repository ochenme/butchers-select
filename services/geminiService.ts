import { Product } from "../types";

// FIX: Export SHEET_API to be used across the application, removing the need for environment variables in components.
export const SHEET_API = "https://script.google.com/macros/s/AKfycbxdj8R5qQdOI_EyqGjDtqUiKQbkxBWlv9lnupwoSppCCr985Bhv_sMDamZgIuliDI5e/exec";


// 🔹 讀取商品（GET）
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    console.log("📡 Fetching products from Google Sheet:", SHEET_API);
    const res = await fetch(SHEET_API);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    return [];
  }
};

// 🔹 新增商品（POST）
export const addProduct = async (product: Product) => {
  const SHEET_API = "https://script.google.com/macros/s/AKfycbz-IFprQoGLeW-BQjaxHTSR-TZ0ZRKQo-CVxOtd78a4iL-5qte98gVR2Pc1NgP9Q-SN/exec";

  const q = new URLSearchParams({
    action: "add",
    id: String(product.id),
    name: product.name || "",
    category: product.category || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    imageUrl: product.imageUrl || "",
  });

  try {
    console.log("🟢 Adding product:", `${SHEET_API}?${q.toString()}`);
    const res = await fetch(`${SHEET_API}?${q.toString()}`);
    const text = await res.text();
    console.log("✅ Add result:", text);
  } catch (err) {
    console.error("❌ Error adding product:", err);
  }
};


/** 📙 更新商品 */
export const updateProduct = async (product: Product) => {
  const q = new URLSearchParams({
    action: "add",
    id: String(product.id),
    name: product.name || "",
    category: product.category || "",
    description: product.description || "",
    price: String(product.price ?? ""),
    imageUrl: encodeURIComponent(product.imageUrl || ""),
  });


  try {
    console.log("🟠 Updating product:", `${SHEET_API}?${q.toString()}`);
    const res = await fetch(`${SHEET_API}?${q.toString()}`);
    const text = await res.text();
    console.log("✅ Update result:", text);
  } catch (err) {
    console.error("❌ Error updating product:", err);
  }
};

/** 📕 刪除商品 */
export const deleteProduct = async (id: string) => {
  const q = new URLSearchParams({
    action: "delete",
    id: String(id),
  });

  try {
    console.log("🔴 Deleting product:", `${SHEET_API}?${q.toString()}`);
    const res = await fetch(`${SHEET_API}?${q.toString()}`);
    const text = await res.text();
    console.log("✅ Delete result:", text);
  } catch (err) {
    console.error("❌ Error deleting product:", err);
  }
};