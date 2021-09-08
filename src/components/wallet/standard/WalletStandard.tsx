import React, { ReactNode } from 'react';
import { Trans } from '@lingui/macro';

import {
  Button,
  More,
  Flex,
  ConfirmDialog,
} from '@chia/core';
import { useRouteMatch } from 'react-router-dom';
import { Send as SendIcon, ChevronRight as ChevronRightIcon } from '@material-ui/icons';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  ListItemIcon,
  MenuItem,
} from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import WalletHistory from '../WalletHistory';
import { deleteUnconfirmedTransactions } from '../../../modules/incoming';
import WalletStandardCards from './WalletStandardCards';
import WalletStatus from '../WalletStatus';
import useOpenDialog from '../../../hooks/useOpenDialog';
import WalletCardReceiveAddress from '../card/WalletCardReceiveAddress';
import WalletStandardHeader from './WalletStandardHeader';

type Props = {
  walletId: number;
  headerTag?: ReactNode;
};

export default function StandardWallet(props: Props) {
  const { walletId, headerTag: HeaderTag } = props;
  const dispatch = useDispatch();
  const openDialog = useOpenDialog();
  const { url } = useRouteMatch();

  async function handleDeleteUnconfirmedTransactions() {
    const deleteConfirmed = await openDialog(
      <ConfirmDialog
        title={<Trans>Confirmation</Trans>}
        confirmTitle={<Trans>Delete</Trans>}
        confirmColor="danger"
      >
        <Trans>Are you sure you want to delete unconfirmed transactions?</Trans>
      </ConfirmDialog>,
    );

    // @ts-ignore
    if (deleteConfirmed) {
      dispatch(deleteUnconfirmedTransactions(walletId));
    }
  }

  return (
    <Flex flexDirection="column" gap={1}>
      {/* HeaderTag && (
        <HeaderTag>
          <Flex alignItems="center">
            <ChevronRightIcon color="secondary" />
            <Trans>Chia Wallet</Trans>
          </Flex>
        </HeaderTag>
      ) */}
      <WalletStandardHeader
        actions={(
          <Button
            color="primary"
            variant="outlined"
            to={`${url}/send`}
            startIcon={<SendIcon />}
          >
            <Trans>Send</Trans>
          </Button>
        )}
      />
      <Flex flexDirection="column" gap={3}>
        <WalletStandardCards walletId={walletId} />
        <WalletCardReceiveAddress walletId={walletId} />
        <WalletHistory walletId={walletId} />
      </Flex>
    </Flex>
  );
}
