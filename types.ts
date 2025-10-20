
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
