"use client";

import Image from "next/image";

export default function InvitePage() {
  return (
    <div className="p-6 md:p-8 lg:p-12 w-full flex flex-col h-full min-h-[calc(100vh-80px)] md:min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-left">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-navy mb-2">Invitation</h1>
        <p className="text-muted text-sm md:text-base">Preview how guests see your invite</p>
      </div>

      {/* Image Container */}
      <div className="relative w-full flex-1 min-h-[60vh] md:min-h-[70vh] rounded-[32px] overflow-hidden card-shadow bg-white group cursor-pointer transition-transform duration-500 hover:scale-[1.02]">
        {/* Mobile Image */}
        <Image
          src="/invitation-mobile.png"
          alt="Wedding Invitation Preview (Mobile)"
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105 block 2xl:hidden [@media(min-width:1024px)_and_(max-height:850px)]:hidden"
          priority
        />
        
        {/* Desktop Image */}
        <Image
          src="/invitation-desktop.png"
          alt="Wedding Invitation Preview (Desktop)"
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105 hidden 2xl:block [@media(min-width:1024px)_and_(max-height:850px)]:block"
          priority
        />
        
        {/* Subtle overlay effect on hover */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[32px] pointer-events-none" />
      </div>
    </div>
  );
}
