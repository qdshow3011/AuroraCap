import { initReactI18next } from 'react-i18next';
import i18next from 'i18next';
import commonEn from './locales/en/common.json';
import commonZh from './locales/zh/common.json';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
      },
      zh: {
        common: commonZh,
      },
    },
    lng: 'zh',
    fallbackLng: 'zh',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
