'use client'
import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Show footer only on homepage
  const showFooter = pathname === '/';

  return showFooter ? <Footer /> : null;
}