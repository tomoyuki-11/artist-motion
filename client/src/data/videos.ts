export type SiteVideo = {
  id: string;
  /** 動画左上のラベル */
  label: string;
  title: string;
  /** `/videos/foo.mp4` のように public 配下を指す */
  src: string;
  /** 任意: サムネイル画像（`/videos/foo.jpg` 等） */
  poster?: string;
  /** 任意: ひとこと説明 */
  description?: string;
  /** 任意: 表示用日付（例: "2026-03-25"） */
  date?: string;
};

/**
 * トップページに表示する「現場の雰囲気」動画一覧。
 * 追加したい場合はここに1件追記するだけでOK。
 */
export const SITE_VIDEOS: SiteVideo[] = [
  {
    id: "rgmlS8vWfuCD8XUAhyXk6M28W3gSfppUAG4XTrXfL6U",
    label: "ベースボールクラブ",
    title: "卒業のメンバー「またな！！」",
    src: "/videos/rgmlS8vWfuCD8XUAhyXk6M28W3gSfppUAG4XTrXfL6U.mp4",
    poster: "/videos/posters/baseball_matana.jpg",
  },
  {
    id: "video_608853753726763115-ztUU8t63",
    label: "風舞流曲技太鼓",
    title: "お釈迦様生誕祭に夜桜公演としてお招きいただきました",
    src: "/videos/video_608853753726763115-ztUU8t63.mp4",
    poster: "/videos/posters/taiko_yozakura.jpg",
  },
  {
    id: "video_609845645553434999-GkpsXeXK",
    label: "器械体操教室",
    title: "初めてのリレー",
    src: "/videos/video_609845645553434999-GkpsXeXK.mp4",
    poster: "/videos/posters/taiso_relay.jpg",
  },
];

