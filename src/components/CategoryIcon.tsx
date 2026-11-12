import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Smartphone,
  HeartPulse,
  Shirt,
  Film,
  MoreHorizontal,
  Wallet as WalletIcon,
  TrendingUp,
  Gift,
  Banknote,
  CreditCard,
  DollarSign,
  Coffee,
  Briefcase,
  GraduationCap,
  Sparkles,
  Plane,
  HelpCircle,
  LucideProps,
} from 'lucide-react';

interface Props extends LucideProps {
  name: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, size = 20, className = '', ...props }) => {
  const iconMap: Record<string, React.ElementType> = {
    'shopping-cart': ShoppingCart,
    'utensils': Utensils,
    'car': Car,
    'home': Home,
    'smartphone': Smartphone,
    'heart-pulse': HeartPulse,
    'shirt': Shirt,
    'film': Film,
    'more-horizontal': MoreHorizontal,
    'wallet': WalletIcon,
    'trending-up': TrendingUp,
    'gift': Gift,
    'banknote': Banknote,
    'credit-card': CreditCard,
    'dollar-sign': DollarSign,
    'coffee': Coffee,
    'briefcase': Briefcase,
    'graduation-cap': GraduationCap,
    'sparkles': Sparkles,
    'plane': Plane,
  };

  const IconComponent = iconMap[name] || HelpCircle;

  return <IconComponent size={size} className={className} {...props} />;
};
