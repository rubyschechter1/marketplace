import Image from 'next/image';

interface BrownHatLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
};

export default function BrownHatLoader({ 
  size = 'medium', 
  text,
  className = ''
}: BrownHatLoaderProps) {
  const dimension = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="animate-tilt">
        <Image
          src="/images/brownhat.png"
          alt="Loading..."
          width={dimension}
          height={dimension}
          className="object-contain"
          priority
        />
      </div>
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}