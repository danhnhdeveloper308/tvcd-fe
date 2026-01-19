export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full">
        {/* Logo */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl p-3 sm:p-5 shadow-2xl shadow-emerald-500/20 border-2 border-emerald-500/30">
            <img
              src="/logo.png"
              alt="TBS GROUP Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain"
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 drop-shadow-2xl">
            HỆ THỐNG THEO DÕI SẢN XUẤT
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl text-emerald-300 font-semibold drop-shadow-lg">
            TBS GROUP - Real-time Production Monitoring
          </p>
        </div>

        {/* CD Product Section */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">
            📦 Chi Tiết BTP (CD)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 lg:gap-6 max-w-5xl mx-auto">
          {/* CD1 */}
          <a
            href="/tvcd?code=cd1"
            className="group bg-gradient-to-br from-slate-800/95 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-1"
          >
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">✂️</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-emerald-300 transition-colors">
              Chi Tiết BTP - Tổ CD1
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-emerald-200/80 text-center leading-relaxed">
              Bảng theo dõi chi tiết bán thành phẩm tổ 1
            </p>
            <div className="mt-4 text-center">
              <span className="text-emerald-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-emerald-300 inline-flex items-center gap-2">
                Nhấn để xem 
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>

          {/* CD2 */}
          <a
            href="/tvcd?code=cd2"
            className="group bg-gradient-to-br from-slate-800/95 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-1"
          >
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">✂️</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-emerald-300 transition-colors">
              Chi Tiết BTP - Tổ CD2
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-emerald-200/80 text-center leading-relaxed">
              Bảng theo dõi chi tiết bán thành phẩm tổ 2
            </p>
            <div className="mt-4 text-center">
              <span className="text-emerald-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-emerald-300 inline-flex items-center gap-2">
                Nhấn để xem 
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>

          {/* CD3 */}
          <a
            href="/tvcd?code=cd3"
            className="group bg-gradient-to-br from-slate-800/95 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-1"
          >
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">✂️</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-emerald-300 transition-colors">
              Chi Tiết BTP - Tổ CD3
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-emerald-200/80 text-center leading-relaxed">
              Bảng theo dõi chi tiết bán thành phẩm tổ 3
            </p>
            <div className="mt-4 text-center">
              <span className="text-emerald-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-emerald-300 inline-flex items-center gap-2">
                Nhấn để xem 
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>

          {/* CD4 */}
          <a
            href="/tvcd?code=cd4"
            className="group bg-gradient-to-br from-slate-800/95 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 hover:-translate-y-1"
          >
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">✂️</div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-emerald-300 transition-colors">
              Chi Tiết BTP - Tổ CD4
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-emerald-200/80 text-center leading-relaxed">
              Bảng theo dõi chi tiết bán thành phẩm tổ 4
            </p>
            <div className="mt-4 text-center">
              <span className="text-emerald-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-emerald-300 inline-flex items-center gap-2">
                Nhấn để xem 
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </a>
        </div>
        </div>

        {/* QSL Section */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">
            🏭 Sản Lượng Nhóm (QSL)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 max-w-5xl mx-auto">
            {/* LINE 1 */}
            <a
              href="/tvqsl?line=1"
              className="group bg-gradient-to-br from-slate-800/95 to-blue-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-blue-500/40 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1"
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">1️⃣</div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-blue-300 transition-colors">
                LINE 1
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 text-center leading-relaxed">
                Sản lượng nhóm Line 1
              </p>
              <div className="mt-4 text-center">
                <span className="text-blue-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-blue-300 inline-flex items-center gap-2">
                  Xem chi tiết 
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </a>

            {/* LINE 2 */}
            <a
              href="/tvqsl?line=2"
              className="group bg-gradient-to-br from-slate-800/95 to-blue-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-blue-500/40 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1"
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">2️⃣</div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-blue-300 transition-colors">
                LINE 2
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 text-center leading-relaxed">
                Sản lượng nhóm Line 2
              </p>
              <div className="mt-4 text-center">
                <span className="text-blue-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-blue-300 inline-flex items-center gap-2">
                  Xem chi tiết 
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </a>

            {/* LINE 3 */}
            <a
              href="/tvqsl?line=3"
              className="group bg-gradient-to-br from-slate-800/95 to-blue-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-blue-500/40 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1"
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">3️⃣</div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-blue-300 transition-colors">
                LINE 3
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 text-center leading-relaxed">
                Sản lượng nhóm Line 3
              </p>
              <div className="mt-4 text-center">
                <span className="text-blue-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-blue-300 inline-flex items-center gap-2">
                  Xem chi tiết 
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </a>

            {/* LINE 4 */}
            <a
              href="/tvqsl?line=4"
              className="group bg-gradient-to-br from-slate-800/95 to-blue-900/30 backdrop-blur-lg rounded-2xl p-5 sm:p-6 lg:p-7 border-2 border-blue-500/40 hover:border-blue-400 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 hover:-translate-y-1"
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 text-center">4️⃣</div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white text-center mb-2 group-hover:text-blue-300 transition-colors">
                LINE 4
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 text-center leading-relaxed">
                Sản lượng nhóm Line 4
              </p>
              <div className="mt-4 text-center">
                <span className="text-blue-400 font-bold text-xs sm:text-sm lg:text-base group-hover:text-blue-300 inline-flex items-center gap-2">
                  Xem chi tiết 
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-10 text-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            © 2025 TBS GROUP. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
  