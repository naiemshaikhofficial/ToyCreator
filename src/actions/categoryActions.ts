'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create a new custom category (e.g. Presets, DAW Templates, Sound Effects)
 */
export async function createCustomCategoryAction(
  name: string,
  description?: string
): Promise<{
  success: boolean;
  data?: { id: string; name: string; slug: string };
  error?: string;
}> {
  if (!name || !name.trim()) {
    return { success: false, error: 'Category name is required.' };
  }

  const cleanName = name.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  try {
    const admin = getAdminClient();

    // Check if category already exists with this slug
    const { data: existing } = await admin
      .from('categories')
      .select('id, name, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing };
    }

    const { data, error } = await admin
      .from('categories')
      .insert({
        name: cleanName,
        slug,
        description: description?.trim() || null,
        sort_order: 10,
        created_at: new Date().toISOString(),
      })
      .select('id, name, slug')
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/products/new');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error creating category.' };
  }
}

/**
 * Server Action: Create a new custom subcategory under a category
 */
export async function createCustomSubcategoryAction(
  categoryId: string,
  name: string
): Promise<{
  success: boolean;
  data?: { id: string; category_id: string; name: string; slug: string };
  error?: string;
}> {
  if (!name || !name.trim()) {
    return { success: false, error: 'Subcategory name is required.' };
  }
  if (!categoryId) {
    return { success: false, error: 'Parent category ID is required.' };
  }

  const cleanName = name.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  try {
    const admin = getAdminClient();

    // Check if subcategory already exists under this category
    const { data: existing } = await admin
      .from('subcategories')
      .select('id, category_id, name, slug')
      .eq('category_id', categoryId)
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return { success: true, data: existing };
    }

    const { data, error } = await admin
      .from('subcategories')
      .insert({
        category_id: categoryId,
        name: cleanName,
        slug,
        sort_order: 15,
        created_at: new Date().toISOString(),
      })
      .select('id, category_id, name, slug')
      .single();

    if (error) {
      console.error('Error creating subcategory:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/products/new');
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error creating subcategory.' };
  }
}
