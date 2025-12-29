import { OrderType } from "@/types";
import * as ImagePicker from 'expo-image-picker';


export function timeAgo(date: string | number | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = (now.getTime() - past.getTime()) / 1000;

  if (diffInSeconds < 60) return "just now";

  const minutes = diffInSeconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;

  const hours = diffInSeconds / 3600;
  if (hours < 24) return `${Math.floor(hours)} h ago`;

  const days = diffInSeconds / 86400;
  if (days < 7) return `${Math.floor(days)} days ago`;

  const weeks = diffInSeconds / 604800;
  if (weeks < 4) return `${Math.floor(weeks)} weeks ago`;

  const months = diffInSeconds / 2592000;
  if (months < 12) return `${Math.floor(months)} months ago`;

  const years = diffInSeconds / 31536000;
  return `${Math.floor(years)} years ago`;
}

export const calcTotalPrice = (order: OrderType) => {
    let totalPrice = 0;

    order.purchases.map((purchase) => {
        totalPrice = totalPrice + (purchase.specification.price * purchase.quantity);
    })

    return totalPrice.toFixed(2)
}


export const pickImage = async () => {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission denied!');
    return;
  }

  // Pick an image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 1,
  });

  if (!result.canceled) {
    // result.assets[0].uri is the selected image URI
    console.log(result.assets[0].uri);
    // setSelectedImage(result.assets[0].uri); // save to state
    return result.assets[0].uri
  }
};

export const pickManyImages = async () => {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission denied!');
    return [];
  }

  // Pick multiple images
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true, // ✅ important
    quality: 1,
  });

  if (!result.canceled) {
    // Get all image URIs
    const imagesUris = result.assets.map(asset => asset.uri);
    console.log(imagesUris);
    return imagesUris; // ✅ array of images
  }

  return [];
};

export const handleLongText = (text: string, limitLength: number): string => {
  if (!text) return "";
  
  if (text.length <= limitLength) {
    return text;
  }

  return text.substring(0, limitLength).trim() + "...";
};