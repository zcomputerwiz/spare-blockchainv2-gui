import React, { useEffect } from 'react';
import { Trans } from '@lingui/macro';
import { Route, Switch, useHistory, useRouteMatch } from 'react-router';
import { useSelector } from 'react-redux';
import { Link } from '@chia/core';
import Wallet from './Wallet';
import type { RootState } from '../../modules/rootReducer';
import WalletType from '../../constants/WalletType';
import LayoutMain from '../layout/LayoutMain';
import WalletCreate from './create/WalletCreate';
import WalletSend from './WalletSend';
import { WalletHeaderTarget, WalletHeaderSource } from './WalletHeader';

export default function Wallets() {
  const { path, isExact } = useRouteMatch();
  const history = useHistory();
  const wallets = useSelector((state: RootState) => state.wallet_state.wallets);
  const loading = !wallets;

  useEffect(() => {
    if (!isExact) {
      return;
    }

    const standardWallet = wallets?.find((wallet) => wallet && wallet.type === WalletType.STANDARD_WALLET);
    if (standardWallet) {
      history.push(`${path}/${standardWallet.id}`)
    }
  }, [wallets, isExact]);

  return (
    <LayoutMain
      loading={loading}
      loadingTitle={<Trans>Loading list of wallets</Trans>}
      title={
        <>
          <Link to="/dashboard/wallets" color="textPrimary">
            <Trans>Wallets</Trans>
          </Link>
          <WalletHeaderTarget />
        </>
      }
    >
      <Switch>
        <Route path={`${path}/add`}>
          <WalletCreate />
        </Route>
        <Route path={`${path}/:walletId`} exact>
          <Wallet headerTag={WalletHeaderSource} />
        </Route>
        <Route path={`${path}/:walletId/send`} exact>
          <WalletSend headerTag={WalletHeaderSource} />
        </Route>
      </Switch>
    </LayoutMain>
  );
}
