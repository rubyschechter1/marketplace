import { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  children: ReactNode
}

export default function Button({ 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'py-3 px-6 text-button rounded-sm transition-all font-normal shadow-[3px_3px_0px_#000000] hover:shadow-[0px_0px_0px_transparent] hover:translate-x-[2px] hover:translate-y-[2px]'
  
  const variants = {
    primary: 'bg-tan text-black border border-black hover:bg-black hover:text-tan',
    secondary: 'bg-tan text-black border border-black hover:bg-black hover:text-tan',
    outline: 'bg-transparent text-black border border-black hover:bg-black hover:text-tan'
  }
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}