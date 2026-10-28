'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import CataloguePickerModal, { SerializedProduct } from './CataloguePickerModal';
import CameraCapture from '@/components/tryon/CameraCapture';

export interface ShopData {
  _id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface ClientClothEntry {
  id: string;
  product?: SerializedProduct;
  user_instruction: string;
  normalized_role: string;
  is_raw_fabric: boolean;
}

interface Props {
  shop: ShopData;
  products: SerializedProduct[];
}

function generateUUID(): string {
  return 'cloth_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

const QUICK_ROLE_SUGGESTIONS = [
  'Jodhpuri jacket',
  'Kurta',
  'Pant',
  'Trouser',
  'Waistcoat',
  'Sherwani',
  'Lehenga',
  'Dupatta',
  'Blouse',
  'Salwar',
];

export default function DesignAttireClient({ shop, products }: Props) {
  // Client Design State
  const [clothes, setClothes] = useState<ClientClothEntry[]>([
    {
      id: generateUUID(),
      user_instruction: '',
      normalized_role: 'garment',
      is_raw_fabric: true,
    },
  ]);

  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [inferredAttire, setInferredAttire] = useState<string>('Custom Attire');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Person photo state
  const [personImageFile, setPersonImageFile] = useState<File | null>(null);
  const [personImagePreview, setPersonImagePreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Processing & Error State
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Whenever clothes change, normalize roles & infer overall attire
  useEffect(() => {
    const validEntries = clothes.filter((c) => c.product || c.user_instruction.trim().length > 0);
    if (validEntries.length === 0) {
      setInferredAttire('Custom Attire');
      setDuplicateWarning(null);
      return;
    }

    const payload = validEntries.map((c) => ({
      id: c.id,
      user_instruction: c.user_instruction || c.product?.name || '',
      category: c.product?.category,
      name: c.product?.name,
    }));

    fetch('/api/tryon/attire/normalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clothes: payload }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInferredAttire(data.inferred_attire || 'Custom Attire');
          setDuplicateWarning(data.duplicate_warning || null);

          setClothes((prev) =>
            prev.map((c) => {
              const matched = data.items?.find((item: any) => item.id === c.id);
              return matched ? { ...c, normalized_role: matched.normalized_role } : c;
            })
          );
        }
      })
      .catch((err) => console.error('Role normalization error:', err));
  }, [clothes.map((c) => c.user_instruction + (c.product?._id || '')).join('|')]);

  // Handlers
  const handleAddCloth = () => {
    setClothes((prev) => [
      ...prev,
      {
        id: generateUUID(),
        user_instruction: '',
        normalized_role: 'garment',
        is_raw_fabric: true,
      },
    ]);
  };

  const handleRemoveCloth = (id: string) => {
    if (clothes.length <= 1) return;
    setClothes((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSelectProduct = (index: number, product: SerializedProduct) => {
    setClothes((prev) => {
      const copy = [...prev];
      const nameLower = product.name.toLowerCase();
      const isFabric =
        nameLower.includes('fabric') ||
        nameLower.includes('wool') ||
        nameLower.includes('silk') ||
        nameLower.includes('cotton') ||
        product.category === 'other';

      const defaultInstruction = isFabric ? `For my ${product.category}` : product.name;

      copy[index] = {
        ...copy[index],
        product,
        user_instruction: copy[index].user_instruction || defaultInstruction,
        is_raw_fabric: isFabric,
      };
      return copy;
    });
  };

  const handleInstructionChange = (index: number, text: string) => {
    setClothes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], user_instruction: text };
      return copy;
    });
  };

  const handlePersonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPersonImageFile(file);
      setPersonImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCameraCapture = (file: File) => {
    setPersonImageFile(file);
    setPersonImagePreview(URL.createObjectURL(file));
    setIsCameraOpen(false);
  };

  const handleGenerate = async () => {
    const readyClothes = clothes.filter((c) => c.product && c.user_instruction.trim().length > 0);
    if (readyClothes.length === 0) {
      setErrorMessage('Please select at least one cloth from the catalogue and specify what it is for.');
      return;
    }
    if (!personImageFile && !personImagePreview) {
      setErrorMessage('Please upload or capture a photo of yourself.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('shop_id', shop._id);
      formData.append('inferred_attire', inferredAttire);

      if (personImageFile) {
        formData.append('person_image', personImageFile);
      }

      const formattedClothes = readyClothes.map((c) => ({
        id: c.id,
        product_id: c.product?._id,
        image_url: c.product?.images.find((i) => i.is_primary)?.url || c.product?.images[0]?.url || '',
        user_instruction: c.user_instruction,
        normalized_role: c.normalized_role,
        is_raw_fabric: c.is_raw_fabric,
        name: c.product?.name,
        category: c.product?.category,
      }));

      formData.append('attire_clothes', JSON.stringify(formattedClothes));

      const res = await fetch('/api/tryon/attire/process', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.code) {
        throw new Error(data.error || 'Failed to start attire generation.');
      }

      // KIOSK-ONLY RESULT FLOW:
      // Customer is immediately taken to the exact SAME Session Code page used by normal Tryonity try-on.
      // Phone shows 6-digit access code & instructions to enter code on showroom terminal display.
      // Generated result is NEVER rendered on the customer's phone!
      window.location.href = `/shop/${shop.slug}/session?code=${encodeURIComponent(data.code)}`;
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070708] text-[#fdfbf7] font-sans relative overflow-x-hidden pb-24">
      {/* Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-3xl px-6 md:px-10 py-6 border-b border-white/10 flex items-center justify-between">
        <Link href={`/shop/${shop.slug}`} className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/50 tracking-widest uppercase">? Back to Showroom</span>
        </Link>

        <h1 className="text-lg md:text-xl font-serif uppercase tracking-widest text-[#fdfbf7] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {shop.name} — Design My Attire
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-12 relative z-10">
        {/* Title Hero */}
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50 border border-white/15 px-4 py-1.5 rounded-full">
            Digital Fashion Assistant
          </span>
          <h2 className="text-3xl md:text-5xl font-serif uppercase tracking-wider text-[#fdfbf7]">
            Design Your Attire
          </h2>
          <p className="text-xs md:text-sm font-mono text-white/60 max-w-lg mx-auto">
            Choose your clothes or raw fabrics and specify what each piece is going to be used for.
          </p>
        </div>

        {/* Dynamic Attire Badge Banner */}
        {inferredAttire && (
          <div className="p-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">?</span>
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/50 block">Inferred Style</span>
                <span className="text-sm font-serif uppercase tracking-widest text-white">{inferredAttire}</span>
              </div>
            </div>
            {duplicateWarning && (
              <p className="text-xs font-mono text-amber-300 bg-amber-500/10 border border-amber-400/30 px-3 py-1.5 rounded-xl">
                {duplicateWarning}
              </p>
            )}
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white">?</button>
          </div>
        )}

        {/* Cloth Entry Slots */}
        <div className="space-y-8">
          {clothes.map((cloth, idx) => {
            const primaryImg = cloth.product?.images.find((i) => i.is_primary)?.url || cloth.product?.images[0]?.url;

            return (
              <div
                key={cloth.id}
                className="group relative rounded-[2rem] p-6 md:p-8 space-y-6 transition-all duration-300 border border-white/10 bg-white/3 backdrop-blur-2xl hover:border-white/20"
                style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              >
                {/* Header of Cloth Entry */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-mono font-bold text-white">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-serif uppercase tracking-widest text-white">
                      Cloth {idx + 1}
                    </h3>
                  </div>

                  {clothes.length > 1 && (
                    <button
                      onClick={() => handleRemoveCloth(cloth.id)}
                      className="text-xs font-mono text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Remove Cloth
                    </button>
                  )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Catalogue Product Card */}
                  <div className="md:col-span-5 flex flex-col items-center text-center space-y-3">
                    {cloth.product ? (
                      <div className="relative aspect-[3/4] w-36 md:w-44 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black">
                        {primaryImg && (
                          <Image src={primaryImg} alt={cloth.product.name} fill className="object-cover" />
                        )}
                        <span
                          className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase border backdrop-blur-md ${
                            cloth.is_raw_fabric
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                              : 'bg-white/20 border-white/30 text-white'
                          }`}
                        >
                          {cloth.is_raw_fabric ? 'Raw Fabric' : 'Finished Garment'}
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => setActivePickerIndex(idx)}
                        className="w-36 md:w-44 aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all p-4"
                      >
                        <span className="text-2xl text-white/40">+</span>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
                          Select Product
                        </span>
                      </div>
                    )}

                    <div>
                      {cloth.product ? (
                        <>
                          <h4 className="text-xs font-serif uppercase tracking-wide text-white">{cloth.product.name}</h4>
                          <button
                            onClick={() => setActivePickerIndex(idx)}
                            className="mt-1 text-[9px] font-mono uppercase tracking-widest text-white/50 underline hover:text-white cursor-pointer"
                          >
                            Change Product
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setActivePickerIndex(idx)}
                          className="px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.18em] border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                        >
                          Select from Catalogue
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Purpose Free-Text Form */}
                  <div className="md:col-span-7 space-y-3">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                      What is this fabric/product for?
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jodhpuri jacket, Kurta, Trouser, Salwar, Lehenga..."
                      value={cloth.user_instruction}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                      className="w-full px-5 py-3.5 rounded-2xl bg-black/50 border border-white/20 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/60 transition-all font-sans"
                    />

                    {/* Quick Suggestions */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Quick Suggestions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_ROLE_SUGGESTIONS.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleInstructionChange(idx, sug)}
                            className="px-3 py-1 rounded-full text-[9px] font-mono uppercase border border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white transition-all cursor-pointer"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Another Cloth Button */}
        <div className="text-center pt-2">
          <button
            onClick={handleAddCloth}
            className="px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-all duration-300 shadow-lg cursor-pointer inline-flex items-center gap-2"
          >
            <span className="text-base">+</span> Add Another Cloth
          </button>
        </div>

        {/* Customer Photo Section */}
        <div className="p-8 rounded-[2.5rem] border border-white/10 bg-white/3 backdrop-blur-2xl space-y-6 text-center">
          <div className="space-y-1">
            <h3 className="text-lg font-serif uppercase tracking-widest text-white">Your Photo</h3>
            <p className="text-xs font-mono text-white/50">Upload or capture a clear photo of yourself to visualize the attire.</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            {personImagePreview ? (
              <div className="relative aspect-[3/4] w-44 rounded-2xl overflow-hidden border border-white/30 shadow-2xl">
                <Image src={personImagePreview} alt="Customer photo" fill className="object-cover" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/80 p-1 rounded-full border border-white/30 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1 text-[8px] font-mono uppercase text-white hover:bg-white/20 rounded-full cursor-pointer"
                  >
                    ?? Camera
                  </button>
                  <label className="px-3 py-1 text-[8px] font-mono uppercase text-white hover:bg-white/20 rounded-full cursor-pointer">
                    ?? Upload
                    <input type="file" accept="image/*" onChange={handlePersonImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="w-44 aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all p-4"
                >
                  <span className="text-3xl">??</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 text-center font-bold">
                    Take Photo
                  </span>
                  <span className="text-[8px] font-mono text-white/40 text-center">Use Live Camera</span>
                </button>

                <label className="w-44 aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center space-y-2 cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all p-4">
                  <span className="text-3xl">??</span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 text-center font-bold">
                    Upload Photo
                  </span>
                  <span className="text-[8px] font-mono text-white/40 text-center">Select image file</span>
                  <input type="file" accept="image/*" onChange={handlePersonImageChange} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Generate Action Button */}
        <div className="text-center pt-4">
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full max-w-md py-5 rounded-full text-xs font-bold uppercase tracking-[0.25em] bg-white text-black hover:bg-white/90 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? 'Creating Showroom Session...' : 'Generate My Attire ?'}
          </button>
        </div>

        {/* Processing Modal Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-fade-in">
            <div className="text-center space-y-6 max-w-md p-8 rounded-[2.5rem] border border-white/20 bg-white/5">
              <div className="w-16 h-16 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-serif uppercase tracking-widest text-white">Preparing Your Attire</h3>
                <p className="text-xs font-mono text-white/60">
                  Creating your showroom access code and initializing AI visualization...
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* Catalogue Picker Modal */}
      {activePickerIndex !== null && (
        <CataloguePickerModal
          isOpen={true}
          onClose={() => setActivePickerIndex(null)}
          products={products}
          onSelectProduct={(prod) => handleSelectProduct(activePickerIndex, prod)}
        />
      )}
    </div>
  );
}
