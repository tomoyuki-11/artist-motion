import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { useState } from "react";
import { ExternalLink, X } from "lucide-react";

const COLUMNS = [
  {
    url: "/column/column-no27.pdf",
    title: "子どもを信じるって何！？",
  },
  {
    url: "/column/column-no26.pdf",
    title: "もうお兄ちゃんなんだから！",
  },
  {
    url: "/column/column-no25.pdf",
    title: "成長にあわせた褒め言葉を！",
  },
  {
    url: "/column/column-no20.pdf",
    title: "「公園遊び」どんな場所を選んでいますか？",
  },
  {
    url: "/column/column-no19.pdf",
    title: "「褒める習慣」をもってあげて！",
  },
  {
    url: "/column/column-no16.pdf",
    title: "「ゲームの時間をなかなか守ってくれない。。。」",
  },
];

type ColumnItem = (typeof COLUMNS)[number];

export default function Column() {
  const [selectedColumn, setSelectedColumn] = useState<ColumnItem | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Helmet>
        <title>子育てコラム | ARTIST MOTION</title>
      </Helmet>
      <Navbar />

      <section className="py-16 md:py-24">
        <div className="container max-w-5xl">
          <div className="mb-8">
            <div className="accent-line bg-slate-400 mb-4 w-16" />
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 tracking-tight">
              子育てコラム
            </h1>
            <p className="mt-3 text-slate-600 leading-relaxed">
              子育てに役立つ情報や日々の気づきをお届けします。
            </p>
          </div>

          {/* PDF コラム一覧（タイトルのみ表示） */}
          <div className="space-y-4">
            {COLUMNS.map((col) => (
              <div key={col.url}>
                <button
                  type="button"
                  onClick={() => setSelectedColumn(col)}
                  className="text-lg font-bold text-slate-800 hover:text-slate-900 underline-offset-4 hover:underline text-left"
                >
                  {col.title}
                </button>
              </div>
            ))}
          </div>

          {/* PDF 表示モーダル（×で閉じる） */}
          <Dialog
            open={!!selectedColumn}
            onOpenChange={(open) => !open && setSelectedColumn(null)}
          >
            <DialogContent
              className="max-w-6xl w-[calc(100vw-2rem)] max-h-[95vh] h-[95vh] p-0 gap-0 flex flex-col overflow-hidden"
              showCloseButton={false}
            >
              {selectedColumn && (
                <>
                  <div className="flex-shrink-0 flex items-center gap-3 pl-4 pr-2 py-3 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-base font-bold text-slate-800 truncate min-w-0 flex-1">
                      {selectedColumn.title}
                    </h2>
                    <a
                      href={selectedColumn.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      新しいタブで開く
                    </a>
                    <DialogClose
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shrink-0"
                      aria-label="閉じる"
                    >
                      <X className="w-6 h-6" />
                    </DialogClose>
                  </div>
                  <div className="flex-1 min-h-0 bg-slate-100">
                    <iframe
                      title={selectedColumn.title}
                      src={`${selectedColumn.url}#navpanes=0&view=Fit`}
                      className="w-full h-full"
                    />
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center text-slate-600 hover:text-slate-800 font-medium text-sm"
            >
              ← トップページへ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
