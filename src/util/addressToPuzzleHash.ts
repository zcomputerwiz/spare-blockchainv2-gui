import { decode } from './toBech32m';

export default function addressToPuzzleHash(address: string): string {
  let puzzleHash = address;
  if (puzzleHash.slice(0, 12) === 'chia_addr://') {
    puzzleHash = puzzleHash.slice(12);
  }

  if (puzzleHash.startsWith('0x') || puzzleHash.startsWith('0X')) {
    return puzzleHash.slice(2);
  }

  try {
    return decode(puzzleHash);  
  } catch {
    const error = new Error(`This is not a valid chia address. ${address}`);
    error.code = 'INVALID_ADDRESS';

    throw error;
  }
}
