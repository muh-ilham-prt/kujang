import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import logo from "../../assets/logo.png";
import useLocalState from "../../hooks/useLocalState";
import useSession from "../../hooks/useSession";
import { SEED as USER_SEED, ensureSuperUser } from "../User/master";

// Swap `kind` + `label` for real screenshots (an `image` field + <img>) once you have them.
const SLIDES = [
  {
    id: 1,
    label: "DIKSAR SATPAM KMB",
    desc: "Pelatihan Gada Pratama adalah pelatihan dasar (Diksar) Satuan Pengamanan bagi anggota / calon anggota Satuan Pengamanan yang belum pernah mengikuti pelatihan di bidang Satuan Pengamanan",
    image:
      "https://kujangmitrabersama.wordpress.com/wp-content/uploads/2021/03/20210202_182825-1.jpg?w=2048",
  },
  {
    id: 2,
    label: "Binlat Senam Drill Tongkat PT KMB",
    desc: "Pembinaan & Latihan",
    image:
      "https://kujangmitrabersama.wordpress.com/wp-content/uploads/2020/08/img-20200718-wa0012-1.jpg?w=2400&h",
  },
  {
    id: 3,
    label: "Binlat Gada Utama PT KMB",
    desc: "Pembinaan & Latihan",
    image:
      "https://kujangmitrabersama.wordpress.com/wp-content/uploads/2020/08/img-20200824-wa0026.jpg?strip=info&w=1280",
  },
  {
    id: 3,
    label: "Binlat Memadamkan Kebakaran PT. KMB",
    desc: "Pembinaan & Latihan",
    image:
      "https://kujangmitrabersama.wordpress.com/wp-content/uploads/2020/08/img-20200621-wa0015.jpg?w=2400&h",
  },
];

const AUTOPLAY_MS = 4000;

function ScreenSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, next]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2.5">
          <span className="size-2 rounded-full bg-red-300" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-300" />
        </div>

        {/* Sliding track — translateX moves by 100% per slide, animated by CSS transition */}
        <div className="relative h-64 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((s) => (
              <div key={s.id} className="h-full w-full shrink-0">
                <img
                  src={s.image}
                  alt={s.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-sm font-medium text-slate-900">
            {SLIDES[index].label}
          </p>
          <p className="text-xs text-slate-500">{SLIDES[index].desc}</p>
        </div>
      </div>

      {/* Prev / next arrows */}
      <button
        type="button"
        onClick={prev}
        aria-label="Sebelumnya"
        className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md transition hover:text-primary"
      >
        <Icon icon="heroicons-outline:chevron-left" className="size-4" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Berikutnya"
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md transition hover:text-primary"
      >
        <Icon icon="heroicons-outline:chevron-right" className="size-4" />
      </button>

      {/* Dot navigation */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ke slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-6 bg-primary"
                : "w-1.5 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

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
          user.password === password,
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
    "w-full rounded-lg border border-slate-300 py-2.5 pl-9 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: interactive slider of previous UI screens — hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-center gap-8 overflow-hidden bg-slate-50 px-12 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="size-9" />
          <span className="text-sm font-semibold text-slate-900">
            Kujang Dashboard
          </span>
        </div>

        <ScreenSlider />

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} PT. Kujang Mitra Bersama
        </p>
      </div>

      {/* Right: login form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <img src={logo} alt="Logo" className="size-14" />
            <h1 className="text-lg font-semibold text-slate-900">
              Kujang Dashboard
            </h1>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Masuk ke Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              Akses internal — khusus pengguna terdaftar
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div>
              <label
                htmlFor="user-id"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                User ID
              </label>
              <div className="group relative">
                <Icon
                  icon="fa6-solid:user"
                  className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
                />
                <input
                  autoComplete="off"
                  id="user-id"
                  type="text"
                  placeholder="Masukkan User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs font-medium text-slate-600"
              >
                Password
              </label>
              <div className="group relative">
                <Icon
                  icon="fa6-solid:lock"
                  className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
                />
                <input
                  autoComplete="off"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
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
                    icon={
                      showPassword ? "fa6-solid:eye-slash" : "fa6-solid:eye"
                    }
                    className="size-3.5"
                  />
                </button>
              </div>
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
              className="group mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Icon
                    icon="fa6-solid:spinner"
                    className="size-3.5 animate-spin"
                  />
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

          <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            © {new Date().getFullYear()} PT. Kujang Mitra Bersama
          </p>
        </div>
      </div>
    </div>
  );
}

