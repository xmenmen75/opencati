export function sliceAddress(address: string): string {
  if (address.length <= 10) return address;
  return address.trim().slice(0, 6) + '***' + address.trim().slice(-3);
}