import plCommon from './pl/common';
import enCommon from './en/common';

const messages: Record<string, Record<string, Record<string, string>>> = {
  pl: {
    common: plCommon,
  },
  en: {
    common: enCommon,
  },
};

export default messages;