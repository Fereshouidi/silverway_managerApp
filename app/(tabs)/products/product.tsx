import PorductsList from '@/components/main/PorductsList/PorductsList';
import SearchBar from '@/components/sub/searchBar';
import { colors } from '@/constants';
import { useProductSection } from '@/contexts/productTab';
import { ProductType } from '@/types';
import React, { CSSProperties } from 'react';
import { View } from 'react-native';

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
  productsSelected: string[],
  setProductsSelected: (value: string[]) => void
  products: ProductType[],
  setProducts: (value: ProductType[]) => void,
  setHiddenModalActive?: (value: boolean) => void
}

const Products = ({
  productSectionVisible,
  setProductSectionVisibile,
  searchBarActive,
  setSearchBarActive,
  productsSelected,
  setProductsSelected,
  products,
  setProducts,
  setHiddenModalActive
}: props) => {

  const { productSectionActive, setProductSectionActive } = useProductSection();


  return (
    <View
      className='w-full h-full p-0'
      style={{
        backgroundColor: colors.light[150],
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
        <SearchBar
          setProducts={setProducts}
        />
      </View>

      <PorductsList
        products={products}
        setProducts={setProducts}
        className={`${searchBarActive && "mt-[75px]"}`}
        productsSelected={productsSelected}
        setProductsSelected={setProductsSelected}
        setHiddenModalActive={setHiddenModalActive}
      />


    </View>
  );
}
export default Products;