'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export interface SerializedProduct {
  _id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  images: Array<{ url: string; public_id: string; is_primary: boolean }>;
  sizes?: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: SerializedProduct[];
  onSelectProduct: (product: SerializedProduct) => void;
}

export default function CataloguePickerModal({ isOpen, onClose, products, onSelectProduct }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  if (!isOpen) return null;

  const categories = Array.from(new Set(products.map((p) => p.category.toUpperCase())));
  const filtered = products.filter((p) => {
    const matchesCat = selectedCat === 'ALL' || p.category.toUpperCase() === selectedCat;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        style={{ background: '#0a0a0c' }}
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-serif uppercase tracking-widest text-[#fdfbf7]">
              Select from Catalogue
            </h2>
            <p className="text-xs font-mono text-white/50 tracking-wider mt-1">
              Choose a garment or raw fabric for your attire
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-6 space-y-4 border-b border-white/5">
          <input
            type="text"
            placeholder="Search by name, fabric, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-full bg-white/5 border border-white/15 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-all font-mono"
          />

          <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
            {['ALL', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold tracking-[0.18em] uppercase transition-all duration-300 flex-shrink-0 cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-white text-black border border-white'
                    : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-white/40 font-mono text-xs tracking-widest uppercase">
              No matching items found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((prod) => {
                const imgUrl = prod.images.find((i) => i.is_primary)?.url || prod.images[0]?.url || '';
                const isFabric = prod.name.toLowerCase().includes('fabric') || 
                                 prod.name.toLowerCase().includes('wool') || 
                                 prod.name.toLowerCase().includes('silk') || 
                                 prod.name.toLowerCase().includes('cotton') || 
                                 prod.name.toLowerCase().includes('linen') ||
                                 prod.category === 'other';

                return (
                  <div
                    key={prod._id}
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="group relative rounded-3xl overflow-hidden border border-white/10 bg-white/3 hover:border-white/50 hover:bg-white/8 transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-[3/4] bg-black overflow-hidden">
                      {imgUrl ? (
                        <Image
                          src={imgUrl}
                          alt={prod.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20 font-mono text-xs">
                          No Image
                        </div>
                      )}
                      
                      {/* Badge for Raw Fabric vs Finished Garment */}
                      <span
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[8px] font-mono font-bold tracking-widest uppercase border backdrop-blur-md ${
                          isFabric
                            ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                            : 'bg-white/20 border-white/30 text-white'
                        }`}
                      >
                        {isFabric ? 'Raw Fabric' : 'Garment'}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-1">
                      <h4 className="text-xs font-serif uppercase tracking-wide text-white group-hover:text-white transition-colors line-clamp-1">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] font-mono text-white/50 uppercase">{prod.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
