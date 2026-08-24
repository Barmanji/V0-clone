function Authlayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-amber-50 bg-gradient-to-b from-teal-300 to-teal-600">
      {children}
    </div>
  );
}

export default Authlayout;
