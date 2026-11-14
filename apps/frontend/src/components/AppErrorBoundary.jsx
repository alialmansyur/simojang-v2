import { Component } from 'react'

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    }
  }

  componentDidCatch(error) {
    console.error('AppErrorBoundary caught error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
          <div className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-900/40 dark:bg-slate-800">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Gangguan Tampilan
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
              Halaman Tidak Dapat Ditampilkan
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Terjadi kendala saat memuat tampilan halaman ini. Silakan muat ulang halaman atau kembali ke beranda.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-2xl bg-[#175CD3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1249A8] cursor-pointer"
              >
                Muat Ulang
              </button>
              <button
                type="button"
                onClick={() => window.location.assign('/')}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
