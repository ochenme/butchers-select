
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string; // Kept for backward compatibility
  imageUrls?: string[];
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
}

export interface MemberProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  address: string;
}