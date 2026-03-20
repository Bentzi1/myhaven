export function PhoneFrame({ children }) {
  return (
    <div className="w-full max-w-[390px] overflow-hidden border-[8px] border-white bg-[#F8F9FB] px-8 py-10 shadow-2xl sm:min-h-[844px] sm:rounded-[40px]">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center sm:min-h-[764px]">
        {children}
      </div>
    </div>
  );
}
