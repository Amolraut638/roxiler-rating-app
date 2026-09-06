export default function AuthCard({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[360px] bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-10">
        {children}
      </div>
    </div>
  )
}
