import { colors } from '@/constants';
import { useProductSection } from '@/contexts/productTab';
import PorductsList from '@/components/main/PorductsList';
import SearchBar from '@/components/sub/searchBar';
import MoreBotton from '@/components/sub/skipButton';
import TopBar from '@/components/sub/topBars/Products';
import { ProductType } from '@/types';
import React, { CSSProperties, useState } from 'react';
import { Platform, View } from 'react-native';

type props = {
    productSectionVisible?: boolean
    setProductSectionVisibile?: (value: boolean) => void
    product?: ProductType
    className?: String
    style?: CSSProperties
    openProduct?: ProductType | null
    setOpenProduct?: (value: ProductType | null) => void
    selectedProducts?: ProductType[]
    setSelectedProducts?: (value: ProductType[]) => void
    searchBarActive: boolean, 
    setSearchBarActive: (value: boolean) => void
    productsSelected: ProductType[], 
    setProductsSelected: (value: ProductType[]) => void
}

const Products = ({
  productSectionVisible,
  setProductSectionVisibile,
  searchBarActive,
  setSearchBarActive,
  productsSelected, 
  setProductsSelected
}: props) => {

  const [products, setProducts] = useState<ProductType[]>([]);
  const {productSectionActive, setProductSectionActive} = useProductSection();
   

  return (
    <View 
      className='w-full h-full p-0'
      style={{
        backgroundColor: colors.light[100],
        width: '100%',
        height: '100%',
        
      }}
    >

      {/* <TopBar/> */}

      <View
        className={`w-full h-[75px] z-50 absolute ${searchBarActive ? "" : "top-[-100px] invisible"} p-2- bg-red-500- mb-1`}
        style={{
          boxShadow: `0 5px 15px ${colors.dark[950]}`,
          // top: searchBarActive ? 100 : ""
        }}
      >
        <SearchBar/>
      </View>

      <PorductsList
        products={products}
        setProducts={setProducts}
        className={`${searchBarActive && "mt-[75px]"}`}
        productsSelected={productsSelected} 
        setProductsSelected={setProductsSelected}
      />


    </View>
  );
}
export default Products;