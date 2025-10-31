import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import { Product, type Order } from "../types";

const PRODUCTS_COLLECTION = "products";
const ORDERS_COLLECTION = "orders";
const ANNOUNCEMENTS_COLLECTION = "announcements";
const ANNOUNCEMENT_DOC_ID = "site";
let cachedAnnouncementDocId: string | null = null;

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const snapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return snapshot.docs.map((document) => ({ id: document.id, ...(document.data() as Omit<Product, "id">) }));
  } catch (error) {
    console.error("Error fetching products from Firestore", error);
    throw error;
  }
};

export const addProduct = async (product: Product) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, product);
  } catch (error) {
    console.error("Error adding product to Firestore", error);
    throw error;
  }
};

export const updateProduct = async (product: Product) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, product, { merge: true });
  } catch (error) {
    console.error("Error updating product in Firestore", error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting product from Firestore", error);
    throw error;
  }
};

export const uploadProductImage = async (file: File | Blob, productId: string): Promise<string> => {
  const fileExtension = ("name" in file && file.name.split(".").pop()) || "png";
  const storageRef = ref(storage, `products/${productId}/${Date.now()}.${fileExtension}`);

  try {
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading product image", error);
    throw error;
  }
};

export const submitOrder = async (order: Order) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, order.orderId);
    await setDoc(orderRef, {
      ...order,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting order to Firestore", error);
    throw error;
  }
};

export const fetchAnnouncement = async (): Promise<string | null> => {
  try {
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, ANNOUNCEMENT_DOC_ID);
    const snapshot = await getDoc(announcementRef);
    if (snapshot.exists()) {
      cachedAnnouncementDocId = snapshot.id;
      const data = snapshot.data() as { message?: string };
      return data.message ?? null;
    }

    const fallbackCollection = await getDocs(collection(db, ANNOUNCEMENTS_COLLECTION));
    const firstDoc = fallbackCollection.docs[0];
    if (firstDoc) {
      cachedAnnouncementDocId = firstDoc.id;
      const data = firstDoc.data() as { message?: string };
      return data.message ?? null;
    }

    cachedAnnouncementDocId = ANNOUNCEMENT_DOC_ID;
    return null;
  } catch (error) {
    console.error("Error fetching announcement from Firestore", error);
    throw error;
  }
};

export const saveAnnouncement = async (message: string) => {
  try {
    const targetDocId = cachedAnnouncementDocId ?? ANNOUNCEMENT_DOC_ID;
    const announcementRef = doc(db, ANNOUNCEMENTS_COLLECTION, targetDocId);
    await setDoc(announcementRef, { message, updatedAt: serverTimestamp() }, { merge: true });
    cachedAnnouncementDocId = targetDocId;
  } catch (error) {
    console.error("Error saving announcement to Firestore", error);
    throw error;
  }
};
