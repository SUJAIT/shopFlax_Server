
const stripNonDigits = (v?: string) => (v ? v.replace(/\D+/g, '') : v);

const keepLeadingPlusDigits = (raw?: string) => {
  if (!raw) return raw;
  const s = raw.trim();
  const plus = s.startsWith('+');
  const digits = s.replace(/\D+/g, '');
  return plus ? `+${digits}` : digits;
};

const isValidBDPhone = (v?: string) => {
  if (!v) return true; // optional field
  const e164 = /^\+8801\d{9}$/;  // +8801*********
  const bd11 = /^01\d{9}$/;      // 01*********
  return e164.test(v) || bd11.test(v);
};




export const helpers = {
  stripNonDigits,
  keepLeadingPlusDigits,
  isValidBDPhone,

};