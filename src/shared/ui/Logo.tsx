import { Link } from "react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-105 active:scale-95">
        M
      </div>
      <span className="text-xl font-bold tracking-tight text-surface-900 dark:text-white">
        UseMap
      </span>
    </Link>
  );
}
