
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string; // Kept for backward compatibility
  imageUrls?: string[];
  freeShippingQuantity?: number;
  freeamount?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = '待確認' | '已出貨' | '已取消';

export interface Order {
  orderId: string;
  timestamp: string;
  customerName: string;
  phone: string;
  address: string;
  total: number;
  items: OrderItem[];
  remittanceProofUrl?: string;
  remittanceSubmitted?: boolean;
  proofUploadedAt?: string;
  createdAt?: string | null;
  status?: OrderStatus;
  userId?: string;
}

export interface MemberProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  ['7-11storeCity']?: string;
  ['7-11storeName']?: string;
  familystoreCity?: string;
  familystoreName?: string;
}