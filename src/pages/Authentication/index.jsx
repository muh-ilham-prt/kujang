import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import logo from "../../assets/logo.png";
import useLocalState from "../../hooks/useLocalState";
import useSession from "../../hooks/useSession";
import { SEED as USER_SEED, ensureSuperUser } from "../User/master";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // Storage saved before the built-in account existed would not contain it
  const [storedUsers] = useLocalState("users", USER_SEED);
  const users = ensureSuperUser(storedUsers);
  const [, setSession] = useSession();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      // ponytail: credentials checked client-side — swap for POST /login when the API lands
      await new Promise((r) => setTimeout(r, 500));
      // Username and email are case-insensitive; the password is not
      const identifier = userId.trim().toLowerCase();
      const match = users.find(
        (user) =>
          (user.username.toLowerCase() === identifier ||
            user.email.toLowerCase() === identifier) &&
          user.password === password
      );
      if (!match) {
        setError("User ID atau password salah");
        return;
      }
      // Never keep the password in the session
      const { password: _, ...safe } = match;
      setSession(safe);
      navigate("/dashboard");
    } catch {
      setError("Terjadi kesalahan saat menghubungi server");
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-300 py-2 pl-9 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Decorative backdrop: drifting glow + faint grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 size-80 animate-blob rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 size-80 animate-blob animation-delay-2000 rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="relative w-full max-w-sm animate-[card-in_0.4s_ease-out] overflow-hidden rounded-2xl border border-white/15 bg-white/95 shadow-2xl shadow-primary/20 backdrop-blur-xl">
        <div className="h-1 bg-linear-to-r from-primary via-purple-500 to-cyan-400" />
        <div className="p-6">
        <div className="mb-5 text-center">
          <img
            src={logo}
            alt="Logo"
            className="mx-auto mb-3 size-14 drop-shadow transition-transform duration-300 hover:scale-110"
          />
          <h1 className="text-lg font-semibold text-slate-900">Kujang Dashboard</h1>
          <p className="text-xs text-slate-500">Masuk ke akun Anda</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="group relative">
            <Icon
              icon="fa6-solid:user"
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
            />
            <input
              autoComplete="off"
              id="user-id"
              type="text"
              aria-label="User ID"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className={fieldClass}
            />
          </div>

          <div className="group relative">
            <Icon
              icon="fa6-solid:lock"
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
            />
            <input
              autoComplete="off"
              id="password"
              type={showPassword ? "text" : "password"}
              aria-label="Password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${fieldClass} pr-9`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              tabIndex={-1}
            >
              <Icon
                icon={showPassword ? "fa6-solid:eye-slash" : "fa6-solid:eye"}
                className="size-3.5"
              />
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex animate-[shake_0.4s] items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              <Icon
                icon="fa6-solid:circle-exclamation"
                className="size-3.5 shrink-0"
              />
              {error}
            </div>
          )}

          <label
            htmlFor="remember"
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <input
              autoComplete="off"
              id="remember"
              type="checkbox"
              className="size-3.5 accent-primary"
            />
            Ingat Saya
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-primary/30 transition hover:shadow-lg hover:shadow-primary/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Icon icon="fa6-solid:spinner" className="size-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                Masuk
                <Icon
                  icon="fa6-solid:arrow-right"
                  className="size-3 transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
