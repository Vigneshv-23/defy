export function isValidEthAddress(addr) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}
