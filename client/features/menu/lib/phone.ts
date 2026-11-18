/** Phone links (§4): dial E.164 through `tel:`, show the local format. */

export const telHref = (e164: string): string => `tel:${e164.replace(/[^\d+]/g, "")}`;

/** `+639170000000` → `0917 000 0000`. Numbers it doesn't recognise are shown as stored. */
export const formatLocalPhone = (e164: string): string => {
  const digits = e164.replace(/\D/g, "");
  const mobile = /^63(9\d{2})(\d{3})(\d{4})$/.exec(digits);
  if (mobile) return `0${mobile[1]} ${mobile[2]} ${mobile[3]}`;
  return e164;
};
