import BottomNav from "./BottomNav"

interface AuthLayoutProps {
  children: React.ReactNode
  variant?: "default" | "fullHeight"
}

export default function AuthLayout({ 
  children, 
  variant = "default" 
}: AuthLayoutProps) {
  return (
    <div className={`min-h-screen ${variant === "default" ? "pb-16" : ""}`}>
      {children}
      <BottomNav />
    </div>
  )
}