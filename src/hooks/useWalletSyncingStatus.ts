import { useSelector } from 'react-redux';
import type { RootState } from '../modules/rootReducer';
import getWalletSyncingStatus from '../util/getWalletSyncingStatus';
import SyncingStatus from '../constants/SyncingStatus';

export default function useWalletSyncingStatus(): SyncingStatus {
  const walletState = useSelector((state: RootState) => state.wallet_state);

  return getWalletSyncingStatus(walletState);
}
