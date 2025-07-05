import BottomNav from "./BottomNav"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {children}
      <BottomNav />
    </div>
  )
}