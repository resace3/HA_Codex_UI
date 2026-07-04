import type { Toast } from "../App";

type Props = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

export default function Toasts({ toasts, onDismiss }: Props) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((toast) => (
        <button type="button" key={toast.id} className={`toast ${toast.kind}`} onClick={() => onDismiss(toast.id)}>
          {toast.message}
        </button>
      ))}
    </div>
  );
}
