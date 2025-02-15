import { Product } from '../models/product.model';

export async function generateSlug(name: string): Promise<string> {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Check if slug exists
  const existingProduct = await Product.findOne({ slug });
  
  if (existingProduct) {
    const count = await Product.countDocuments({
      slug: new RegExp(`^${slug}(-[0-9]*)?$`)
    });
    slug = `${slug}-${count + 1}`;
  }

  return slug;
}
