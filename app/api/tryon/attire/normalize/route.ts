import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Deterministic normalization map for fast, zero-cost role resolution
function normalizeRoleDeterministic(text: string, category?: string, name?: string): string {
  const clean = `${text} ${category || ''} ${name || ''}`.toLowerCase();
  
  if (clean.includes('jodhpuri')) return 'jodhpuri_jacket';
  if (clean.includes('sherwani')) return 'sherwani';
  if (clean.includes('lehenga')) return 'lehenga';
  if (clean.includes('dupatta')) return 'dupatta';
  if (clean.includes('blouse')) return 'blouse';
  if (clean.includes('waistcoat') || clean.includes('vest')) return 'waistcoat';
  if (clean.includes('blazer') || clean.includes('coat')) return 'jacket';
  if (clean.includes('jacket')) return 'jacket';
  if (clean.includes('kurta') || clean.includes('kameez')) return 'kurta';
  if (clean.includes('shirt')) return 'shirt';
  if (clean.includes('pant') || clean.includes('trouser') || clean.includes('pyjama') || clean.includes('pajama') || clean.includes('salwar') || clean.includes('churidar') || clean.includes('bottom') || clean.includes('lower')) return 'bottom';
  
  return 'garment';
}

// Deterministic overall attire inference
function inferAttireType(roles: string[]): string {
  const set = new Set(roles);
  
  if (set.has('jodhpuri_jacket')) return 'Jodhpuri Outfit';
  if (set.has('sherwani')) return 'Sherwani Outfit';
  if (set.has('lehenga') || (set.has('blouse') && set.has('dupatta'))) return 'Lehenga Outfit';
  if (set.has('waistcoat') && set.has('jacket') && set.has('shirt')) return 'Formal 3-Piece Suit';
  if (set.has('jacket') && set.has('shirt') && set.has('bottom')) return 'Formal Suit';
  if (set.has('kurta') && set.has('bottom')) return 'Kurta Set';
  
  return 'Custom Attire';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clothes: Array<{ id: string; user_instruction: string; category?: string; name?: string }> = body.clothes || [];

    if (!Array.isArray(clothes) || clothes.length === 0) {
      return NextResponse.json({ error: 'At least one cloth is required.' }, { status: 400 });
    }

    const normalizedItems = await Promise.all(
      clothes.map(async (item) => {
        let role = normalizeRoleDeterministic(item.user_instruction, item.category, item.name);
        
        // If deterministic normalization is generic, use Gemini Flash text for natural language intent
        if (role === 'garment' && item.user_instruction.trim().length > 3) {
          try {
            const prompt = `Classify this customer's clothing description into ONE of these exact categories: [jodhpuri_jacket, jacket, kurta, shirt, bottom, waistcoat, sherwani, lehenga, blouse, dupatta, other]. Customer text: "${item.user_instruction}". Return ONLY the category name.`;
            const res = await ai.models.generateContent({
              model: process.env.VERTEX_AI_TEXT_MODEL || 'gemini-2.5-flash',
              contents: [{ text: prompt }],
            });
            const textRole = res.text?.trim().toLowerCase();
            if (textRole && ['jodhpuri_jacket', 'jacket', 'kurta', 'shirt', 'bottom', 'waistcoat', 'sherwani', 'lehenga', 'blouse', 'dupatta'].includes(textRole)) {
              role = textRole;
            }
          } catch (e) {
            console.warn('[normalize-route] LLM fallback failed, using deterministic fallback');
          }
        }

        return {
          id: item.id,
          user_instruction: item.user_instruction,
          normalized_role: role,
        };
      })
    );

    const rolesList = normalizedItems.map((i) => i.normalized_role);
    const inferred_attire = inferAttireType(rolesList);

    // Check for duplicate role assignments
    const roleCounts: Record<string, number> = {};
    rolesList.forEach((r) => {
      if (r !== 'garment' && r !== 'bottom') {
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      }
    });

    let duplicate_warning: string | null = null;
    const dupRole = Object.keys(roleCounts).find((r) => roleCounts[r] > 1);
    if (dupRole) {
      const roleReadable = dupRole.replace('_', ' ');
      duplicate_warning = `You have assigned multiple items to ${roleReadable}. Would you like to keep both or edit one?`;
    }

    return NextResponse.json({
      success: true,
      items: normalizedItems,
      inferred_attire,
      duplicate_warning,
    });
  } catch (err: any) {
    console.error('[normalize-route] Error:', err);
    return NextResponse.json({ error: 'Failed to normalize roles.' }, { status: 500 });
  }
}
