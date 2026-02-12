import { Link } from "react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="text-xl">
        Logo
      </span>
    </Link>
  );
}
