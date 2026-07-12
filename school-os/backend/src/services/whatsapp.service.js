/**
 * WhatsApp Messaging Service (Mock/Placeholder)
 * 
 * In production, this would integrate with:
 * - Twilio WhatsApp API
 * - Meta WhatsApp Business API
 * - Or a library like whatsapp-web.js
 */

export async function sendWhatsAppMessage(toPhoneNumber, message) {
  // Strip non-numeric characters for logging
  const cleanPhone = (toPhoneNumber || "").replace(/\D/g, "");
  
  if (!cleanPhone) {
    console.error("[WhatsApp Service] Failed to send: No phone number provided.");
    return false;
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  console.log("==================================================");
  console.log(`💬 WHATSAPP MESSAGE SENT TO: +91 ${cleanPhone}`);
  console.log("--------------------------------------------------");
  console.log(message);
  console.log("==================================================");

  return true;
}

export async function sendFeeReceipt(toPhoneNumber, studentName, amount, receiptNo, link) {
  const message = `*St. S.N. Public School*\n\nDear Parent,\nWe have received a fee payment of *₹${amount}* for ${studentName}.\n\nReceipt No: ${receiptNo}\n\nView and download your digital receipt here:\n${link}\n\nThank you!`;
  
  return sendWhatsAppMessage(toPhoneNumber, message);
}
