/**
 * 保護者・門下生・会員の声（お客様の声）データ
 */
export type TestimonialCategory = "taiko" | "taiso" | "baseball" | "fitness";

export interface TestimonialItem {
  id: string;
  category: TestimonialCategory;
  categoryLabel: string;
  body: string;
}

export const TESTIMONIAL_CATEGORIES: Record<TestimonialCategory, string> = {
  taiko: "風舞流曲技太鼓門下生の声",
  taiso: "器械体操教室保護者の声",
  baseball: "ベースボールクラブ保護者の声",
  fitness: "フィットネスクラス会員の声",
};

export const TESTIMONIALS: TestimonialItem[] = [
  // 風舞流曲技太鼓門下生の声
  {
    id: "taiko-1",
    category: "taiko",
    categoryLabel: "風舞流曲技太鼓門下生の声",
    body: "とても難しい太鼓ですが、覚えていく毎に楽しくなっていきます。",
  },
  {
    id: "taiko-2",
    category: "taiko",
    categoryLabel: "風舞流曲技太鼓門下生の声",
    body: "知れば知るほど「芸」の深さがわかってきます。",
  },
  {
    id: "taiko-3",
    category: "taiko",
    categoryLabel: "風舞流曲技太鼓門下生の声",
    body: "週一回の稽古がとてもストレス解消になっており、家族も応援してくれています。",
  },
  // 器械体操教室保護者の声
  {
    id: "taiso-1",
    category: "taiso",
    categoryLabel: "器械体操教室保護者の声",
    body: "保護者の子どもに関する悩みをしっかり聞いていただける先生方なのでとても安心しています。",
  },
  {
    id: "taiso-2",
    category: "taiso",
    categoryLabel: "器械体操教室保護者の声",
    body: "インドアな息子が外で遊ぶようになり嬉しく思います。",
  },
  {
    id: "taiso-3",
    category: "taiso",
    categoryLabel: "器械体操教室保護者の声",
    body: "出来ることが増えるととても自信になって保育園でも積極的になりました。",
  },
  // ベースボールクラブ保護者の声
  {
    id: "baseball-1",
    category: "baseball",
    categoryLabel: "ベースボールクラブ保護者の声",
    body: "野球と子どもの専門家なので絶対的な信頼をおいています。",
  },
  {
    id: "baseball-2",
    category: "baseball",
    categoryLabel: "ベースボールクラブ保護者の声",
    body: "とにかく子どもが毎週通うことを楽しみにしており、空き時間も野球に積極的になりました。",
  },
  {
    id: "baseball-3",
    category: "baseball",
    categoryLabel: "ベースボールクラブ保護者の声",
    body: "特に野球経験のあるお父さん方も巻き込んでいただくので大人のストレス解消にもなっています。",
  },
  // フィットネスクラス会員の声
  {
    id: "fitness-1",
    category: "fitness",
    categoryLabel: "フィットネスクラス会員の声",
    body: "親切なコーチで寄り添ってくれるスタンスがとても心強いです。",
  },
  {
    id: "fitness-2",
    category: "fitness",
    categoryLabel: "フィットネスクラス会員の声",
    body: "些細なことも相談に乗りやすい存在です。",
  },
];

/** トップページで表示する抜粋（各カテゴリから1件ずつなど） */
export function getTestimonialsForHome(limit: number = 4): TestimonialItem[] {
  const byCategory = new Map<TestimonialCategory, TestimonialItem[]>();
  for (const t of TESTIMONIALS) {
    const list = byCategory.get(t.category) ?? [];
    list.push(t);
    byCategory.set(t.category, list);
  }
  const order: TestimonialCategory[] = ["taiko", "taiso", "baseball", "fitness"];
  const result: TestimonialItem[] = [];
  for (const cat of order) {
    const items = byCategory.get(cat) ?? [];
    if (items.length > 0) result.push(items[0]);
    if (result.length >= limit) break;
  }
  return result;
}
