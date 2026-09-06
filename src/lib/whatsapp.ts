/** Builds a wa.me deep link with a prefilled, URL-encoded message.
 * `number` may contain spaces/dashes/leading zeros — normalized to digits only. */
export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/[^\d]/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
