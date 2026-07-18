import { createClient } from '@supabase/supabase-js';

const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

// Pre-defined local collection of 10 cookies as a fallback/mock data source
export const LOCAL_COOKIES = [
  {
    id: 1,
    name: "The Dark Chocolate Chunk",
    ingredients: "72% Single-Origin Venezuelan Cacao & Maldon Sea Salt",
    description: "36-hour cured brown butter dough, baked to a golden crisp with gooey chocolate pools.",
    price: 220,
    image: "/assets/hero_cookie.png",
    top_seller: true
  },
  {
    id: 2,
    name: "The Golden Hazelnut Praline",
    ingredients: "Piedmont Hazelnuts & House-Made Dark Chocolate Praline",
    description: "Brown butter dough folded with double-roasted hazelnuts and a molten praline core.",
    price: 250,
    image: "/assets/cookie_hazelnut.png",
    top_seller: true
  },
  {
    id: 3,
    name: "The Pistachio Rose Blossom",
    ingredients: "Persian Pistachios, Cardamom & Organic Rose Petals",
    description: "Cardamom-infused dough loaded with ivory chocolate chunks, pistachios, and organic rose petals.",
    price: 280,
    image: "/assets/cookie_pistachio.png",
    top_seller: true
  },
  {
    id: 4,
    name: "The Smoked Sea Salt Pecan",
    ingredients: "Toasted Georgia Pecans & 40% Maple-Smoked Milk Chocolate",
    description: "Toasted maple pecans folded with maple-smoked milk chocolate, finished with smoked salt.",
    price: 240,
    image: "/assets/cookie_pecan.png",
    top_seller: true
  },
  {
    id: 5,
    name: "The Midnight Sesame Matcha",
    ingredients: "Uji Matcha Chocolate & Roasted Black Sesame Praline",
    description: "Activated charcoal dough with a liquid black sesame center and Uji matcha chunks.",
    price: 230,
    image: "/assets/cookie_sesame.png",
    top_seller: false
  },
  {
    id: 6,
    name: "The Lavender Earl Grey",
    ingredients: "Organic Bergamot, Dried Lavender & Ivory Chocolate",
    description: "Bergamot tea steeped dough folded with ivory chocolate and organic lavender buds.",
    price: 215,
    image: "/assets/cookie_lavender.png",
    top_seller: false
  },
  {
    id: 7,
    name: "The Salted Caramel Toffee",
    ingredients: "House-Made Salted Caramel & Valrhona Toffee Shards",
    description: "Thick, crinkled dough with molten pockets of salted caramel and crunchy toffee shards.",
    price: 225,
    image: "/assets/cookie_caramel.png",
    top_seller: false
  },
  {
    id: 8,
    name: "The Classic Vanilla Bean",
    ingredients: "Madagascar Vanilla & Belgian White Chocolate",
    description: "Vanilla bean dough with white chocolate pools and Bourbon vanilla sugar.",
    price: 200,
    image: "/assets/cookie_vanilla.png",
    top_seller: false
  },
  {
    id: 9,
    name: "The Espresso Macchiato",
    ingredients: "Espresso Infused Dough & Dark Chocolate Pools",
    description: "Dark coffee dough with milk chocolate pools and roasted espresso dust.",
    price: 235,
    image: "/assets/cookie_espresso.png",
    top_seller: false
  },
  {
    id: 10,
    name: "The Velvet Cheesecake",
    ingredients: "Red Velvet Cocoa & Sweet Cream Cheese Core",
    description: "Red cocoa dough with a rich cream cheese core and white chocolate chunks.",
    price: 245,
    image: "/assets/cookie_velvet.png",
    top_seller: false
  }
];

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export async function fetchCookies() {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Falling back to local cookies registry.");
    return LOCAL_COOKIES;
  }
  try {
    const { data, error } = await supabase.from('cookies').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || LOCAL_COOKIES;
  } catch (err) {
    console.error("Failed to fetch from Supabase. Falling back to local cookies registry.", err);
    return LOCAL_COOKIES;
  }
}

export const LOCAL_GIFT_BOXES = [
  {
    id: 1,
    name: "The Birthday Casket",
    curated_for: "Birthdays & Celebration",
    description: "Make celebrations truly unforgettable. Features a premium box, a custom gold-foil greeting card, and a sweet, hand-baked selection of our softest cookies.",
    contents: "Classic Vanilla Bean, Salted Caramel Toffee, Velvet Cheesecake",
    price: 45,
    image: "/assets/gift_birthday.png"
  },
  {
    id: 2,
    name: "The Anniversary Chest",
    curated_for: "Anniversaries & Milestones",
    description: "Curated for romance and grand milestones. Includes a deep crimson wax-sealed message card and an elegant selection of aromatic, high-end cookies.",
    contents: "Pistachio Rose Blossom, Golden Hazelnut Praline, Midnight Sesame Matcha",
    price: 55,
    image: "/assets/gift_anniversary.png"
  },
  {
    id: 3,
    name: "The Corporate Cabinet",
    curated_for: "Corporate & Professional Gratitude",
    description: "Make a striking impression of professional distinction. Fully customisable ribbon and hot-stamped client greeting card alongside premium energy-boosting blends.",
    contents: "Espresso Macchiato, Smoked Sea Salt Pecan, Dark Chocolate Chunk",
    price: 65,
    image: "/assets/gift_corporate.png"
  }
];

export async function fetchGiftBoxes() {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Falling back to local gift boxes registry.");
    return LOCAL_GIFT_BOXES;
  }
  try {
    const { data, error } = await supabase.from('gift_boxes').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || LOCAL_GIFT_BOXES;
  } catch (err) {
    console.error("Failed to fetch gift boxes from Supabase. Falling back to local registry.", err);
    return LOCAL_GIFT_BOXES;
  }
}

export async function incrementCookieViews(cookieId) {
  if (!supabase) return;
  try {
    // Try via RPC first
    const { error } = await supabase.rpc('increment_cookie_views', { cookie_id: cookieId });
    if (error) {
      console.warn("RPC increment views failed, falling back to update", error);
      // Fallback
      const { data, error: selectError } = await supabase.from('cookies').select('views').eq('id', cookieId).single();
      if (!selectError && data) {
        await supabase.from('cookies').update({ views: (data.views || 0) + 1 }).eq('id', cookieId);
      }
    }
  } catch (e) {
    console.error("Failed to increment cookie views", e);
  }
}

export async function incrementCookieClicks(cookieId) {
  if (!supabase) return;
  try {
    // Try via RPC first
    const { error } = await supabase.rpc('increment_cookie_clicks', { cookie_id: cookieId });
    if (error) {
      console.warn("RPC increment clicks failed, falling back to update", error);
      // Fallback
      const { data, error: selectError } = await supabase.from('cookies').select('clicks').eq('id', cookieId).single();
      if (!selectError && data) {
        await supabase.from('cookies').update({ clicks: (data.clicks || 0) + 1 }).eq('id', cookieId);
      }
    }
  } catch (e) {
    console.error("Failed to increment cookie clicks", e);
  }
}

export async function createOrder(orderData) {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Mocking order creation.");
    return { data: orderData, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
    return { data, error };
  } catch (err) {
    console.error("Failed to create order in Supabase", err);
    return { data: null, error: err };
  }
}

export async function fetchOrders() {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Returning empty order list.");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch orders from Supabase", err);
    return [];
  }
}

export async function updateOrderStatus(orderId, status) {
  if (!supabase) return { data: null, error: new Error("Supabase client is not initialized.") };
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();
    return { data, error };
  } catch (err) {
    console.error(`Failed to update order status for order ID: ${orderId}`, err);
    return { data: null, error: err };
  }
}

export async function createCorporateInquiry(inquiryData) {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Mocking corporate inquiry creation.");
    return { data: inquiryData, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('corporate_inquiries')
      .insert([inquiryData])
      .select()
      .single();
    return { data, error };
  } catch (err) {
    console.error("Failed to create corporate inquiry in Supabase", err);
    return { data: null, error: err };
  }
}

export async function fetchCorporateInquiries() {
  if (!supabase) {
    console.warn("Supabase credentials not configured. Returning empty corporate inquiries list.");
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('corporate_inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch corporate inquiries from Supabase", err);
    return [];
  }
}

export async function updateCorporateInquiryStatus(inquiryId, status) {
  if (!supabase) return { data: null, error: new Error("Supabase client is not initialized.") };
  try {
    const { data, error } = await supabase
      .from('corporate_inquiries')
      .update({ status })
      .eq('id', inquiryId)
      .select()
      .single();
    return { data, error };
  } catch (err) {
    console.error(`Failed to update corporate inquiry status for ID: ${inquiryId}`, err);
    return { data: null, error: err };
  }
}

