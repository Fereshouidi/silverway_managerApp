type Lang = 'ar' | 'en';

export const formatSmartDate = (input: Date | string | number, lang: Lang = 'en'): string => {
  const date = new Date(input);
  const now = new Date();

  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const year = date.getFullYear();

  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsAr = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
                    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  const dayName = lang === 'ar' ? daysAr[date.getDay()] : daysEn[date.getDay()];
  const month = lang === 'ar' ? monthsAr[date.getMonth()] : monthsEn[date.getMonth()];

  const isSameYear = date.getFullYear() === now.getFullYear();

  if (diffDays === 0) {
    return `${hours}:${minutes}`;
  } else if (diffDays < 7) {
    return dayName;
  } else if (isSameYear) {
    return month;
  } else {
    return `${month} ${year}`;
  }
};
