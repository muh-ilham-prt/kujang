import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";

export default function TopCard({ countEmployee }) {
  return (
    <div className="w-full bg-white rounded-xl py-4 shadow-md flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-b-slate-300 pb-3 px-6">
        <h5 className="text-xl font-semibold tracking-tight text-slate-900">
          Total
        </h5>
      </div>

      <div className="w-full px-6 py-2">
        <div className="w-full bg-linear-to-br border-none from-purple-800 to-blue-600 hover:from-blue-600 hover:to-purple-800 rounded-[30px] overflow-hidden shadow-lg transition-all duration-300 transform hover:scale-[1.01] p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full">
              <Icon
                icon="heroicons-outline:user-circle"
                className="h-6 w-6 text-white"
              />
            </div>
            <h3 className="text-lg font-semibold text-white">Total Karyawan</h3>
          </div>

          <div className="flex w-full items-center justify-between mt-8">
            <h2 className="font-bold text-6xl text-white">{countEmployee}</h2>
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 cursor-pointer transition-all duration-300">
              <Icon
                icon="ion:ios-arrow-forward"
                className="w-7 h-7 text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="font-medium text-white/90 text-base">
              Jumlah seluruh karyawan dalam sistem
            </div>
            <Link to="/master/employee" className="block mt-4">
              <button
                type="button"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-none text-white font-medium flex justify-center items-center w-full rounded-full px-5 py-3 transition-all duration-300"
              >
                <Icon
                  icon="heroicons-outline:users"
                  className="mr-2 h-5 w-5"
                />
                Lihat Detail Karyawan
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
