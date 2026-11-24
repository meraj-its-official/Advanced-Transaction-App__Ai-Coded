export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            PayFlow
          </h1>
          <p className="text-gray-400 mt-2">Smart &amp; Secure Payments</p>
        </div>
        {children}
      </div>
    </div>
  );
}
