import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CSSProperties, Ref } from "react";
import { GestureResponderEvent, ImageSourcePropType, StyleProp, TextInput, TextStyle, ViewStyle } from "react-native";


type language = {
  fr: string | null,
  en: string | null
}

export type ScreenContextType = {
  screenWidth: number
  setScreenWidth: (value: number) => void
}

export type SideBarProps = {
  isActive: boolean
  setIsActive: (value: boolean) => void
  ownerInfo?: OwnerInfoType
  setOwnerInfo: (value: OwnerInfoType) => void
}

export type MenuIconProps = {
  isSideBarActive: boolean,
  setIsSideBarActive: (value: boolean) => void
}

export type HeaderProps = {
  isSideBarActive: boolean,
  setIsSideBarActive: (value: boolean) => void
  ownerInfo?: OwnerInfoType
  setOwnerInfo: (value: OwnerInfoType) => void
}

export type SearchBarProps = {
  className?: string
  inputClassName?: string
  style?: CSSProperties,
  inputStyle?: CSSProperties,
  searchIcon: string,
  searchIconClassName?: string,
  searchIconStyle?: CSSProperties,
  containerClassName?: string
}

export type Themes = "system" | "dark" | "light"

export type ThemeProps = {
  label: string
  theme: Themes
  icon: {
    dark: string,
    light: string
  }
}

export type ThemeContextType = {
  themeDispo: ThemeProps[]
  activeTheme: Themes
  setActiveTheme: (value: "light" | "dark") => void
  colors: Colors
}

export type LanguageStracture = {
  label: "english" | "français",
  language: "en" | "fr",
  nav: {
    home: string,
    collection: string,
    collections: string,
    contact: string,
  },
  sideMatter: {
    search: string,
    theme: {
      system: string,
      dark: string,
      light: string,
    },
    more: string,
    allCollections: string,
    noRes: string
  }
}

export type LanguageContextType = {
  activeLanguage: LanguageStracture
  setActiveLanguage: (value: LanguageStracture) => void
}



export type Colors = {
  light: Record<
    100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900,
    string
  >;
  dark: Record<
    100 | 150 | 200 | 250 | 300 | 350 | 400 | 450 | 500 | 550 | 600 | 650 | 700 | 750 | 800 | 850 | 900,
    string
  >;
};


export type PubType = {
  topBar?: {
    fr: string;
    en: string;
  };
  heroBanner?: {
    sm: string;
    md: string;
  };
  bottomBanner?: {
    sm: string;
    md: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// types/owner.ts

export type SocialMediaItem = {
  platform: string;
  icon: string;
  link: string;
}

export type OwnerInfoType = {
  name: string;
  logo: {
    dark: string;
    light: string;
  };
  socialMedia: SocialMediaItem[];
  contact: {
    email: string;
    mailPassword?: string; // اختياري في العرض
    phone: number;
  };
  homeCollections: string[]; // IDs
  topCollections: string[];  // IDs
  collectionsInSideBar: string[]; // IDs
  shippingCost: number;
  freeShippingThreshold: number;
  aiPrompt: string;
}

export type ProductSpecification = {
  _id?: string | null;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  type?: string | null;
  price?: number | null;
  quantity?: number | null;
  unlimited?: boolean;
}

export type ProductImage = {
  uli: string;
  specification: ProductSpecification
}

export type ProductToEditType = {
  _id?: string | null;
  name: {
    fr: string | null;
    en: string | null;
  };
  price: string | null;
  oldPrice: string | null;
  thumbNail: string | null;
  images: {
    uri: string;
    specification?: string | ProductSpecification | null;
  }[];
  description: {
    fr: string | null;
    en: string | null;
  };
  collections: string[];
  stock: number | null;
  specifications: ProductSpecificationToEdit[];
  status?: "active" | "archived" | "deleted";
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type ProductSpecificationToEdit = {
  _id?: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  type?: string | null;
  price?: string | null;
  quantity?: number | null;
  unlimited?: boolean;
}

export type ProductType = {
  _id?: string | null;
  name: {
    fr: string | null;
    en: string | null;
  };
  price: number | null;
  oldPrice: number | null;
  thumbNail: string | null;
  images: {
    uri: string,
    specification: ProductSpecification;
  }[];
  description: {
    fr: string | null;
    en: string | null;
  };
  collections: string[];
  stock: number | null;
  specifications: ProductSpecification[];
  status?: "active" | "deleted" | "archived"
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type CollectionType = {
  _id?: string | null;
  name: language;
  thumbNail?: string | null;
  status?: "active" | "deleted" | "archived"
  type: "private" | "public";
  display: "vertical" | "horizontal";
  customizable?: "none" | "base" | "pendant";
}

export interface PurchaseType {
  _id?: string;
  client?: ClientType | string | null;
  product?: string | null;
  evaluation?: string | null;
  specification?: ProductSpecification | string | null;
  like?: boolean | null;
  quantity?: number | null;
  cart?: string | null;
  order?: string | null;
  status?: "viewed" | "inCart" | "ordered" | 'delivered'
  isCustomized?: boolean;
  customizedCharms?: { charm: string | ProductType, charmId: string, spec?: string, x: number, y: number }[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type ClientType = {
  _id?: string | null;
  fullName?: string;
  email?: string;
  token: number;
  phone?: number;
  password?: string;
  address?: string;
  aiNote?: string;
};

// export type AdminType = {
//   _id?: string
//   fullName?: string
//   email?: string
//   phone?:  Number
//   password?: string
//   token?: string
//   type: AdminTypes
//   aiNote?: string
//   isVerified?: boolean
//   createdAt?: Date | null;
//   updatedAt?: Date | null;
// }

export type AdminTypes = "bigBoss" | "normalAdmin"

export type AdminType = {
  _id?: string;
  fullName?: string;
  email?: string;
  phone?: number;
  password?: string;
  token?: string;
  devices?: string[];
  accesses: AdminAccess[];
  type: AdminTypes;
  aiNote?: string;
  isVerified?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type AdminAccess =
  | "Open Analytics page"
  | "Open Orders page"
  | "Open Products page"
  | "Open People page"
  | "Open setting page"
  | "View Clients data"
  | "View Admins data"
  | "View delivery worker data"
  | "Manage Products"
  | "Manage Collections"
  | "Edit Prices"
  | "Manage Orders"
  | "Manage Staff"
  | "Control Settings"
  | "Open notifications page"
  ;

export interface OrderType {
  _id?: string;
  orderNumber?: number;
  client?: string;
  address?: string
  clientNote?: string
  status?: "pending" | "delivered" | "failed";
  purchases: PurchaseType[]
  shippingCoast?: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type DeliveryWorkerType = {
  _id?: string
  fullName?: string
  email?: string
  phone?: Number
  password?: string
  address?: string
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export type FiltrationType = {
  price: {
    from: number
    to: number
  }
  collections: string[]
  colors: string[]
  types: string[]
  sizes: string[]

  sortBy: 'price' | 'name' | 'date'
  sortDirection: 'asc' | 'desc'
  activeLanguage: "fr" | "en"

}


export interface customInputParams {
  tittle?: string,
  className?: string,
  inputClassName?: string,
  tittleClassName?: string,
  placeholder?: string,
  icon?: string,
  iconClassname?: string,
  numberOfLines?: number,
  ref?: Ref<TextInput>,
  value?: string,
  setValue?: (text: string) => void,
  onChangeText?: (text: string) => void
}

export interface OnboardingParams {
  id: number,
  title?: string,
  image?: ImageSourcePropType
  description?: string,
}

export interface ButtonParams {
  tittle?: string,
  icon?: ImageSourcePropType,
  onPress?: ((event: GestureResponderEvent) => void) | undefined,
  className?: string,
  textClassName?: string,
  isWork: boolean,
  textStyle?: StyleProp<TextStyle>,
  style?: StyleProp<ViewStyle>,
  iconStyle?: StyleProp<any>
  iconClassName?: string
}

export type WelcomeProps = {
  navigation: NativeStackNavigationProp<any>;
};