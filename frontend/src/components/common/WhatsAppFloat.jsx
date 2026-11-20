import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

/**
 * WhatsAppFloat Component
 * Floating round WhatsApp button with animations for instant scholar & document verification.
 */
export const WhatsAppFloat = ({
  phoneNumber = '918660609247',
  defaultMessage = 'Hi Educarrus! I need help with academic guidance.',
  position = 'bottom-left',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure 10-digit Indian numbers get the '91' country code prefix for WhatsApp wa.me
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

  // WhatsApp click-to-chat API URL
  const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  const positionClasses =
    position === 'bottom-right'
      ? 'bottom-6 right-6'
      : position === 'stacked-right'
      ? 'bottom-24 right-6'
      : 'bottom-6 left-6';

  return (
    <aside
      aria-label="WhatsApp Support and Guidance"
      className={`fixed ${positionClasses} z-50 flex items-center select-none ${className}`}
    >
      {/* Floating Animated Round WhatsApp Button */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          y: [0, -8, 0],
          boxShadow: [
            '0 10px 25px -4px rgba(37, 211, 102, 0.4), 0 4px 6px -4px rgba(37, 211, 102, 0.2)',
            '0 20px 35px -4px rgba(37, 211, 102, 0.65), 0 8px 10px -4px rgba(37, 211, 102, 0.35)',
            '0 10px 25px -4px rgba(37, 211, 102, 0.4), 0 4px 6px -4px rgba(37, 211, 102, 0.2)',
          ],
        }}
        transition={{
          y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
        }}
        whileHover={{
          scale: 1.12,
          rotate: [0, -6, 6, 0],
          transition: { duration: 0.3 },
        }}
        whileTap={{ scale: 0.92 }}
        className="relative group w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-full bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#25D366] text-white flex items-center justify-center border-2 border-emerald-200/80 cursor-pointer shadow-2xl transition-transform"
        aria-label="Chat on WhatsApp for instant verification"
      >
        {/* Animated Outer Pulse / Ripple Rings */}
        <span className="absolute -inset-1.5 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
        <span className="absolute -inset-3 rounded-full bg-[#25D366]/25 blur-md animate-pulse pointer-events-none" />

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white drop-shadow-md z-10"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>

        {/* Verified Badge Icon in corner */}
        <span
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-md border border-emerald-300 z-20"
          title="Verified Support"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
        </span>
      </motion.a>
    </aside>
  );
};

export default WhatsAppFloat;
