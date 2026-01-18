import logoImage from "@/assets/logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 40, text: "text-lg" },
  md: { icon: 56, text: "text-2xl" },
  lg: { icon: 72, text: "text-3xl" },
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="rounded-full bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/10 p-2 ring-2 ring-primary/30 shadow-md shadow-primary/10"
        style={{ width: icon + 16, height: icon + 16 }}
      >
        <img
          src={logoImage}
          alt="NewtonAI Logo"
          width={icon}
          height={icon}
          className="object-contain rounded-full"
        />
      </div>
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent ${text}`}>
          NewtonAI
        </span>
      )}
    </div>
  );
};

export default Logo;
