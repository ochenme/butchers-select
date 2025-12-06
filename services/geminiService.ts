import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import { OrderStatus, Product, type Order } from "../types";

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

export const uploadProductImages = async (files: File[], productId: string): Promise<string[]> => {
  const uploadPromises = files.map(async (file, index) => {
    const fileExtension = file.name.split(".").pop() || "png";
    const storageRef = ref(storage, `products/${productId}/${Date.now()}_${index}.${fileExtension}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error("Error uploading product images", error);
    throw error;
  }
};

export const submitOrder = async (order: Order) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, order.orderId);
    await setDoc(orderRef, {
      ...order,
      timestamp: order.timestamp ?? new Date().toISOString(),
      remittanceSubmitted: order.remittanceSubmitted ?? false,
      status: order.status ?? "待確認",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting order to Firestore", error);
    throw error;
  }
};

export const uploadOrderProof = async (file: File, orderId: string): Promise<string> => {
  const fileExtension = file.name.split(".").pop() || "png";
  const storageRef = ref(storage, `orders/${orderId}/proof-${Date.now()}.${fileExtension}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const saveOrderProof = async (orderId: string, proofUrl: string) => {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  await setDoc(
    orderRef,
    {
      remittanceProofUrl: proofUrl,
      remittanceSubmitted: true,
      proofUploadedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const fetchOrders = async (): Promise<Order[]> => {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs
    .map((document) => {
      const data = document.data() as Partial<Order> & { createdAt?: { toDate: () => Date }; proofUploadedAt?: { toDate: () => Date } };
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.timestamp ?? null;

      return {
        orderId: data.orderId ?? document.id,
        timestamp: data.timestamp ?? createdAt ?? "",
        customerName: data.customerName ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        total: data.total ?? 0,
        items: data.items ?? [],
        remittanceProofUrl: data.remittanceProofUrl,
        remittanceSubmitted: data.remittanceSubmitted ?? !!data.remittanceProofUrl,
        proofUploadedAt: data.proofUploadedAt?.toDate ? data.proofUploadedAt.toDate().toISOString() : undefined,
        createdAt,
        status: data.status ?? "待確認",
        userId: data.userId,
      } as Order;
    })
    .sort((a, b) => {
      const getTime = (value?: string | null) => (value ? new Date(value).getTime() : 0);
      return getTime(b.createdAt ?? b.timestamp) - getTime(a.createdAt ?? a.timestamp);
    });
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), where("userId", "==", userId));

  const snapshot = await getDocs(ordersQuery);

  return snapshot.docs
    .map((document) => {
      const data = document.data() as Partial<Order> & { createdAt?: { toDate: () => Date }; proofUploadedAt?: { toDate: () => Date } };
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.timestamp ?? null;

      return {
        orderId: data.orderId ?? document.id,
        timestamp: data.timestamp ?? createdAt ?? "",
        customerName: data.customerName ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        total: data.total ?? 0,
        items: data.items ?? [],
        remittanceProofUrl: data.remittanceProofUrl,
        remittanceSubmitted: data.remittanceSubmitted ?? !!data.remittanceProofUrl,
        proofUploadedAt: data.proofUploadedAt?.toDate ? data.proofUploadedAt.toDate().toISOString() : undefined,
        createdAt,
        status: data.status ?? "待確認",
        userId: data.userId,
      } as Order;
    })
    .sort((a, b) => {
      const getTime = (value?: string | null) => (value ? new Date(value).getTime() : 0);
      return getTime(b.createdAt ?? b.timestamp) - getTime(a.createdAt ?? a.timestamp);
    });
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

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await setDoc(orderRef, { status }, { merge: true });
  } catch (error) {
    console.error("Error updating order status in Firestore", error);
    throw error;
  }
};