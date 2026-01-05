import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 48, text: "text-2xl" },
  lg: { icon: 64, text: "text-3xl" },
};

const Logo = ({ size = "md", showText = false, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImage}
        alt="NewtonAI Logo"
        width={icon}
        height={icon}
        className="object-contain"
      />
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      )}
    </div>
  );
};

export default Logo;
