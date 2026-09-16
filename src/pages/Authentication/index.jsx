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
      navigate("/");
    } catch {
      setError("Terjadi kesalahan saat menghubungi server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow p-6">
        <div className="flex flex-col lg:flex-row">
          {/* Left side - Login Form */}
          <div className="w-full lg:w-7/12 p-8 lg:p-12">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-5">
                <img
                  src={logo}
                  alt="Logo"
                  width={96}
                  height={96}
                  className="mx-auto mb-6 size-24"
                />
                <h1 className="text-2xl font-bold text-gray-900">
                  Masuk ke akun Anda
                </h1>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="user-id"
                    className="mb-2 block text-base font-medium text-gray-900"
                  >
                    User ID
                  </label>
                  <div className="relative">
                    <Icon
                      icon="fa6-solid:user"
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
                    />
                    <input
                      id="user-id"
                      type="text"
                      placeholder="Masukkan User ID Anda"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 p-2.5 pl-10 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-base font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Icon
                      icon="fa6-solid:lock"
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
                    />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan Password Anda"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 p-2.5 pl-10 pr-10 text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      tabIndex={-1}
                    >
                      <Icon
                        icon={
                          showPassword ? "fa6-solid:eye-slash" : "fa6-solid:eye"
                        }
                        className="size-4"
                      />
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-red-100 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input id="remember" type="checkbox" className="size-4" />
                  <label htmlFor="remember" className="text-base text-gray-900">
                    Ingat Saya
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-linear-to-br from-purple-600 to-blue-500 px-5 py-3 text-white disabled:opacity-60"
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                </button>
              </form>
            </div>
          </div>

          {/* Right side - Welcome Banner */}
          <div className="w-full lg:w-4/6 hidden lg:flex bg-linear-to-br from-blue-600 to-blue-800 items-center justify-center lg:-mr-6 lg:-my-6 rounded-tl-[30px] rounded-tr-[180px] rounded-br-[30px] rounded-bl-[180px] py-16 lg:py-0 border-x-8 border-x-slate-200">
            <div className="text-center text-white px-8 lg:px-12">
              <p className="text-lg lg:text-xl mb-4 opacity-90">
                Selamat datang,
              </p>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Kujang</h2>
              <p className="text-lg lg:text-xl">Kujang Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
