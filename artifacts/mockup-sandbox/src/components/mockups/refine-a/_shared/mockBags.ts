export type MockBag = {
  id: number;
  title: string;
  storeName: string;
  originalPrice: number;
  discountedPrice: number;
  pickupStart: string;
  pickupEnd: string;
  distance: string;
  category: 'meals' | 'bakery_sweets' | 'ingredients';
  itemType: 'bag' | 'item';
  ownerComment: string;
  photoUrl: string;
  soldOut: boolean;
  lowStock: boolean;
  tags: string[];
};

export const mockBags: MockBag[] = [
  {
    id: 1,
    title: "特製・彩り幕の内弁当",
    storeName: "日本料理 和心",
    originalPrice: 1500,
    discountedPrice: 750,
    pickupStart: "19:00",
    pickupEnd: "20:00",
    distance: "350m",
    category: "meals",
    itemType: "item",
    ownerComment: "本日のランチで多めにお作りした幕の内弁当です。焼き魚と季節のお野菜がたっぷりです。",
    photoUrl: "/__mockup/images/refine-a/bag1.png",
    soldOut: false,
    lowStock: true,
    tags: ["和食", "手作り"]
  },
  {
    id: 2,
    title: "本日のパン詰め合わせ",
    storeName: "Boulangerie artisan",
    originalPrice: 1200,
    discountedPrice: 500,
    pickupStart: "18:30",
    pickupEnd: "19:30",
    distance: "1.2km",
    category: "bakery_sweets",
    itemType: "bag",
    ownerComment: "カンパーニュやクロワッサンなど、本日焼き上げたパンを4〜5個お入れします。",
    photoUrl: "/__mockup/images/refine-a/bag2.png",
    soldOut: false,
    lowStock: false,
    tags: ["無添加", "自家製酵母"]
  },
  {
    id: 3,
    title: "季節のタルトと焼き菓子セット",
    storeName: "Patisserie Fleur",
    originalPrice: 1800,
    discountedPrice: 800,
    pickupStart: "19:30",
    pickupEnd: "20:30",
    distance: "800m",
    category: "bakery_sweets",
    itemType: "bag",
    ownerComment: "ショーケースに残ったケーキと焼き菓子のセットです。ティータイムのお供に。",
    photoUrl: "/__mockup/images/refine-a/bag3.png",
    soldOut: true,
    lowStock: false,
    tags: ["スイーツ", "カフェ"]
  },
  {
    id: 4,
    title: "朝採れ野菜おまかせセット",
    storeName: "Green Farm Market",
    originalPrice: 1000,
    discountedPrice: 400,
    pickupStart: "17:00",
    pickupEnd: "19:00",
    distance: "2.5km",
    category: "ingredients",
    itemType: "bag",
    ownerComment: "少し傷があるものや形が不揃いな農家直送の新鮮野菜をたっぷりおすそわけします。",
    photoUrl: "/__mockup/images/refine-a/bag4.png",
    soldOut: false,
    lowStock: true,
    tags: ["有機野菜", "産地直送"]
  },
  {
    id: 5,
    title: "自家製ミートソースとパスタ",
    storeName: "Trattoria Roma",
    originalPrice: 1600,
    discountedPrice: 700,
    pickupStart: "21:00",
    pickupEnd: "22:30",
    distance: "400m",
    category: "meals",
    itemType: "item",
    ownerComment: "じっくり煮込んだ特製ミートソース。ディナーの余剰分をお得にご提供。",
    photoUrl: "/__mockup/images/refine-a/bag5.png",
    soldOut: false,
    lowStock: false,
    tags: ["イタリアン", "ディナー"]
  },
  {
    id: 6,
    title: "グルメサンドイッチ",
    storeName: "Cafe & Deli",
    originalPrice: 900,
    discountedPrice: 450,
    pickupStart: "16:00",
    pickupEnd: "18:00",
    distance: "150m",
    category: "meals",
    itemType: "item",
    ownerComment: "生ハムとルッコラのサンドイッチ。明日の朝食にもおすすめです。",
    photoUrl: "/__mockup/images/refine-a/bag6.png",
    soldOut: false,
    lowStock: false,
    tags: ["カフェ", "軽食"]
  }
];