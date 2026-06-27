import ProductForm from '@/components/dashboard/ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Add Product' };

export default function NewProductPage() {
  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Add Product</h1>
        <p className="text-styleswap-muted text-sm mt-1">Add a new item to your catalogue</p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
