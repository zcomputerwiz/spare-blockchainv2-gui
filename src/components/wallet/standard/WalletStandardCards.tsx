import React from 'react';
import { Grid } from '@material-ui/core';
import WalletCardTotalBalance from '../card/WalletCardTotalBalance';
import WalletCardSpendableBalance from '../card/WalletCardSpendableBalance';
import WalletCardPendingTotalBalance from '../card/WalletCardPendingTotalBalance';
import WalletCardPendingBalance from '../card/WalletCardPendingBalance';
import WalletCardPendingChange from '../card/WalletCardPendingChange';

type Props = {
  walletId: number;
};

export default function WalletStandardCards(props: Props) {
  const { walletId } = props;

  return (
    <div>
      <Grid spacing={3} alignItems="stretch" container>
        <Grid xs={12} md={4} item>
          <WalletCardTotalBalance wallet_id={walletId} />
        </Grid>
        <Grid xs={12} md={8} item>
          <Grid spacing={3} alignItems="stretch" container>
            <Grid xs={12} sm={6} item>
              <WalletCardSpendableBalance wallet_id={walletId} />
            </Grid>
            <Grid xs={12} sm={6} item>
              <WalletCardPendingTotalBalance wallet_id={walletId} />
            </Grid>
            <Grid xs={12} sm={6} item>
              <WalletCardPendingBalance wallet_id={walletId} />
            </Grid>
            <Grid xs={12} sm={6} item>
              <WalletCardPendingChange wallet_id={walletId} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
}
