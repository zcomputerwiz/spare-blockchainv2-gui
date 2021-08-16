import React from 'react';
import { Trans } from '@lingui/macro';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { Alert } from '@material-ui/lab';
import { Loading } from '@chia/core';
import WalletStandard from './standard/WalletStandard';
import WalletColoured from './coloured/WalletColoured';
import WalletRateLimited from './rateLimited/WalletRateLimited';
import WalletDID from './did/DIDWallet';
import WalletType from '../../constants/WalletType';
import type { RootState } from '../../modules/rootReducer';

export default function Wallet() {
  const { walletId: walletIdParam } = useParams<{ walletId: string }>();
  const walletId = Number(walletIdParam);
  const wallets = useSelector((state: RootState) => state.wallet_state.wallets);
  const wallet = wallets?.find((item) => item && item.id === walletId);
  const loading = !wallets;

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!wallet) {
    return (
      <Alert severity="warning">
        <Trans>Wallet does not exists</Trans>
      </Alert>
    );
  }

  if (wallet.type === WalletType.STANDARD_WALLET) {
    return (
      <WalletStandard walletId={walletId} />
    );
  }

  if (wallet.type === WalletType.COLOURED_COIN) {
    return (
      <WalletColoured wallet_id={walletId} />
    );
  }

  if (wallet.type === WalletType.RATE_LIMITED) {
    return (
      <WalletRateLimited wallet_id={walletId} />
    );
  }

  if (wallet.type === WalletType.DISTRIBUTED_ID) {
    return (
      // @ts-ignore
      <WalletDID wallet_id={walletId} />
    );
  }

  return (
    <Alert severity="warning">
      <Trans>Unsupported type of wallet</Trans>
    </Alert>
  );
}
