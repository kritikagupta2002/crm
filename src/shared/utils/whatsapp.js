/* Opens WhatsApp (app or web) with the message typed in — no API needed; the user presses send. */
export const whatsappLink = (phone, text) => `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
