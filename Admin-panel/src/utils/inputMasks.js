export const maskName = (value) =>
  value.replace(/[^a-zA-ZА-Яа-яЁёÀ-žʻʼ'\-\s]/g, '');

export const maskPassport = (value) => {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const letters = cleaned.slice(0, 2).replace(/[^A-Z]/g, '');
  const digits = cleaned.slice(letters.length)
    .replace(/[^0-9]/g, '')
    .slice(0, 7);
  return (letters + digits).slice(0, 9);
};

export const maskPhone = (value) => {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 0) return '';
  if (!digits.startsWith('998')) {
    return ('998' + digits).slice(0, 12);
  }
  return digits.slice(0, 12);
};

export const maskShare = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  if (parts[1]?.length > 2) return parts[0] + '.' + parts[1].slice(0, 2);
  if (parseFloat(cleaned) > 100) return '100';
  return cleaned;
};

export const maskDigitsOnly = (value) =>
  value.replace(/[^0-9]/g, '');
