import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSupabaseClient,
  hasServiceRoleKey,
  SERVICE_ROLE_MISSING_MESSAGE,
} from '@/lib/supabase/server';
import { verifyAdminServerSession } from '@/lib/auth/verifyAdmin';

export const dynamic = 'force-dynamic';

const BUCKET = 'product-images';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches the bucket's file_size_limit
const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/svg+xml',
];

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string | null;
  /** True for the bundled /public assets, which cannot be deleted. */
  isBuiltIn?: boolean;
}

/** The SVGs shipped in /public — always offered so the picker is never empty. */
const BUILT_IN_ASSETS: MediaAsset[] = [
  { name: 'Whey Isolate (built-in)', url: '/images/whey-isolate.svg' },
  { name: 'Creatine (built-in)', url: '/images/creatine.svg' },
  { name: 'Collagen (built-in)', url: '/images/collagen.svg' },
  { name: 'Protein Bar (built-in)', url: '/images/protein-bar.svg' },
  { name: 'Plant Protein (built-in)', url: '/images/plant-protein.svg' },
  { name: 'Pre-Workout (built-in)', url: '/images/pre-workout.svg' },
  { name: 'Steel Shaker (built-in)', url: '/images/steel-shaker.svg' },
].map((asset) => ({
  id: `builtin:${asset.url}`,
  name: asset.name,
  url: asset.url,
  storagePath: asset.url,
  mimeType: 'image/svg+xml',
  sizeBytes: null,
  createdAt: null,
  isBuiltIn: true,
}));

/** Turns "Vanilla Whey 1kg.PNG" into "vanilla-whey-1kg.png". */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** GET — the media library, newest uploads first, built-ins last. */
export async function GET() {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // The migration may not have been applied yet — the picker still works
      // off the bundled assets rather than failing outright.
      console.warn('[API ADMIN MEDIA GET]', error.message);
      return NextResponse.json({ success: true, assets: BUILT_IN_ASSETS, libraryReady: false });
    }

    const uploaded: MediaAsset[] = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      storagePath: row.storage_path,
      mimeType: row.mime_type ?? null,
      sizeBytes: row.size_bytes ?? null,
      createdAt: row.created_at ?? null,
      isBuiltIn: false,
    }));

    return NextResponse.json({
      success: true,
      assets: [...uploaded, ...BUILT_IN_ASSETS],
      libraryReady: true,
    });
  } catch (error: any) {
    console.error('[API ADMIN MEDIA GET ERROR]', error);
    return NextResponse.json({ success: true, assets: BUILT_IN_ASSETS, libraryReady: false });
  }
}

/** POST — multipart upload of a new product image. */
export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  // Uploading to storage requires the service role; without it the request
  // fails deep inside Supabase with an unhelpful RLS message.
  if (!hasServiceRoleKey()) {
    return NextResponse.json(
      { success: false, error: SERVICE_ROLE_MISSING_MESSAGE },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const providedName = String(formData.get('name') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file was uploaded.' }, { status: 400 });
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported image type "${file.type}". Use PNG, JPEG, WebP, AVIF, or SVG.` },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: `Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 5 MB.` },
        { status: 400 }
      );
    }

    // A human-readable name is required so the asset is findable in the library
    // later; fall back to the filename when the form did not supply one.
    const displayName = providedName || file.name.replace(/\.[^.]+$/, '');
    const extension = (file.name.split('.').pop() || 'png').toLowerCase();
    const uniqueSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const storagePath = `${slugify(displayName) || 'product'}-${uniqueSuffix}.${extension}`;

    const supabase = createAdminSupabaseClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[API ADMIN MEDIA UPLOAD ERROR]', uploadError.message);
      return NextResponse.json(
        {
          success: false,
          error: uploadError.message.includes('Bucket not found')
            ? 'Storage bucket "product-images" is missing. Apply supabase/migrations/20260807_product_media.sql.'
            : uploadError.message,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    const asset: MediaAsset = {
      id: `media_${uniqueSuffix}`,
      name: displayName,
      url: publicUrl,
      storagePath,
      mimeType: file.type,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      isBuiltIn: false,
    };

    const { error: insertError } = await supabase.from('product_media').insert([
      {
        id: asset.id,
        name: asset.name,
        storage_path: asset.storagePath,
        url: asset.url,
        mime_type: asset.mimeType,
        size_bytes: asset.sizeBytes,
        uploaded_by: adminCheck.userId ?? null,
      },
    ]);

    if (insertError) {
      // The file is in the bucket and usable; only the library index failed.
      console.warn('[API ADMIN MEDIA INDEX WARN]', insertError.message);
      return NextResponse.json({
        success: true,
        asset,
        warning: 'Image uploaded, but it could not be added to the media library index.',
      });
    }

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('[API ADMIN MEDIA POST ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** DELETE — removes an uploaded asset from both the bucket and the library. */
export async function DELETE(req: NextRequest) {
  const adminCheck = await verifyAdminServerSession();
  if (!adminCheck.authorized) return adminCheck.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Asset id is required.' }, { status: 400 });
    }
    if (id.startsWith('builtin:')) {
      return NextResponse.json(
        { success: false, error: 'Built-in illustrations cannot be deleted.' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const { data: row } = await supabase
      .from('product_media')
      .select('storage_path, url')
      .eq('id', id)
      .single();

    if (!row) {
      return NextResponse.json({ success: false, error: 'Asset not found.' }, { status: 404 });
    }

    // Refuse to orphan a product that is still pointing at this image.
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('image_url', row.url);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `This image is still used by ${count} product${count === 1 ? '' : 's'}. Reassign them first.`,
        },
        { status: 409 }
      );
    }

    await supabase.storage.from(BUCKET).remove([row.storage_path]);
    await supabase.from('product_media').delete().eq('id', id);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('[API ADMIN MEDIA DELETE ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
