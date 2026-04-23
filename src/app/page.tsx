export default function Dashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2">Selamat datang di DocGene, sistem otomatisasi dokumen.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'DOP', desc: 'Generate Daftar Orang Perjalanan', color: 'bg-blue-500' },
          { title: 'Surat Tugas', desc: 'Generate Surat Tugas resmi', color: 'bg-indigo-500' },
          { title: 'Kwitansi', desc: 'Generate Kwitansi Perjalanan Dinas', color: 'bg-violet-500' },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <div className={`w-12 h-12 rounded-xl ${card.color} text-white flex items-center justify-center mb-4 shadow-sm`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{card.title}</h3>
            <p className="text-slate-500 mt-1 text-sm">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
