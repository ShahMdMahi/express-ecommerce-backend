export type EcommerceEventName =
  | 'view_item'                    // When user views a product
  | 'view_item_list'              // When user views a product list/category
  | 'view_cart'                   // When user views their cart
  | 'begin_checkout'              // When user starts checkout process
  | 'add_shipping_info'           // When user adds shipping info
  | 'add_payment_info'            // When user adds payment info
  | 'add_to_cart'                 // When user adds item to cart
  | 'remove_from_cart'            // When user removes item from cart
  | 'select_item'                 // When user clicks on product
  | 'purchase'                    // When user completes purchase
  | 'refund'                      // When order is refunded
  | 'view_promotion'              // When user views promotion
  | 'select_promotion'            // When user selects promotion
  | 'page_view';                  // When user views a page

export interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
  currency: string;
  discount?: number;
}

export interface EcommerceEvent {
  name: EcommerceEventName;
  params: {
    currency: string;
    value?: number;
    items?: EcommerceItem[];
    payment_type?: string;
    transaction_id?: string;
    shipping?: number;
    tax?: number;
    coupon?: string;
    [key: string]: any;
  };
  user_id?: string;
  client_id?: string;
  timestamp: number;
}
