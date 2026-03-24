import { Loader2, Sparkles } from 'lucide-react';

export const BAG_LABELS = [
  { value: 'bakery',      label: 'パン',       emoji: '🥐' },
  { value: 'restaurant',  label: 'お弁当',     emoji: '🍱' },
  { value: 'sweets',      label: 'スイーツ',   emoji: '🍰' },
  { value: 'other',       label: '惣菜',       emoji: '🥗' },
  { value: 'cafe',        label: 'カフェ',     emoji: '☕' },
  { value: 'convenience', label: 'コンビニ',   emoji: '🏪' },
  { value: 'supermarket', label: 'スーパー',   emoji: '🛒' },
  { value: 'produce',     label: '野菜・果物', emoji: '🍎' },
  { value: 'meat',        label: '肉・魚',     emoji: '🥩' },
  { value: 'noodles',     label: '麺類',       emoji: '🍜' },
  { value: 'drinks',      label: 'ドリンク',   emoji: '🥤' },
];

export function CategoryPicker({
  value, onChange, classifying = false, aiSuggested = null,
}: {
  value: string;
  onChange: (v: string) => void;
  classifying?: boolean;
  aiSuggested?: string | null;
}) {
  const suggestedCat = BAG_LABELS.find(c => c.value === aiSuggested);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-bold text-muted-foreground">
          ラベル <span className="text-muted-foreground/60 font-normal">（任意）</span>
        </label>
        {classifying && (
          <span className="flex items-center gap-1 text-[10px] text-violet-500 font-bold">
            <Loader2 className="w-3 h-3 animate-spin" />
            AIが判定中...
          </span>
        )}
        {!classifying && suggestedCat && value !== aiSuggested && (
          <button
            type="button"
            onClick={() => onChange(aiSuggested!)}
            className="flex items-center gap-1 text-[10px] bg-violet-50 text-violet-600 border border-violet-200 rounded-full px-2 py-0.5 font-bold hover:bg-violet-100 transition-colors"
          >
            <Sparkles className="w-2.5 h-2.5" />
            AI判定: {suggestedCat.emoji} {suggestedCat.label}
          </button>
        )}
        {!classifying && suggestedCat && value === aiSuggested && (
          <span className="flex items-center gap-1 text-[10px] text-violet-500 font-bold">
            <Sparkles className="w-2.5 h-2.5" />
            AI自動判定
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {BAG_LABELS.map((cat) => {
          const isActive = value === cat.value;
          const isAI     = cat.value === aiSuggested && !classifying;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange(isActive ? '' : cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                isActive
                  ? 'bg-primary border-primary text-white shadow-sm shadow-primary/25'
                  : isAI && value === ''
                    ? 'bg-violet-50 border-violet-300 text-violet-700 ring-1 ring-violet-300 ring-offset-1'
                    : 'bg-white border-border text-foreground hover:border-primary/40'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
              {isAI && !isActive && <Sparkles className="w-2.5 h-2.5 text-violet-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
