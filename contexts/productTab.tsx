import React, { createContext, useContext, useState } from 'react';
import { ProductType } from '@/types';

type ProductSectionContextType = {
  productSectionActive: boolean;
  setProductSectionActive: (value: boolean) => void;
  openProduct: ProductType | null;
  setOpenProduct: (product: ProductType | null) => void;
  selectedProducts: ProductType[];
  setSelectedProducts: (products: ProductType[]) => void;
};

const ProductSectionContext = createContext<ProductSectionContextType | null>(null);

export const useProductSection = () => {
  const ctx = useContext(ProductSectionContext);
  if (!ctx) throw new Error('useProductContext must be used inside ProductProvider');
  return ctx;
};

export const ProductSectionProvider = ({ children }: { children: React.ReactNode }) => {
  const [productSectionActive, setProductSectionActive] = useState(false);
  const [openProduct, setOpenProduct] = useState<ProductType | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([]);

  return (
    <ProductSectionContext.Provider
      value={{
        productSectionActive,
        setProductSectionActive,
        openProduct,
        setOpenProduct,
        selectedProducts,
        setSelectedProducts,
      }}
    >
      {children}
    </ProductSectionContext.Provider>
  );
};
