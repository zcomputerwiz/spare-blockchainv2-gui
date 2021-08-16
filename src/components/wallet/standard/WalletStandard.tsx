import React from 'react';
import { Trans } from '@lingui/macro';
import {
  Button,
  More,
  Flex,
  ConfirmDialog,
} from '@chia/core';
import { useRouteMatch } from 'react-router-dom';
import { Send as SendIcon } from '@material-ui/icons';
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

type Props = {
  walletId: number;
};

export default function StandardWallet(props: Props) {
  const { walletId } = props;
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
      <Flex gap={1} alignItems="center">
        <Flex flexGrow={1}>
          <Typography variant="h5" gutterBottom>
            <Trans>Chia Wallet</Trans>
          </Typography>
        </Flex>
        <Button
          color="primary"
          variant="outlined"
          to={`${url}/send`}
          startIcon={<SendIcon />}
        >
          <Trans>Send</Trans>
        </Button>
        <More>
          {({ onClose }) => (
            <Box>
              <MenuItem
                onClick={() => {
                  onClose();
                  handleDeleteUnconfirmedTransactions();
                }}
              >
                <ListItemIcon>
                  <DeleteIcon />
                </ListItemIcon>
                <Typography variant="inherit" noWrap>
                  <Trans>Delete Unconfirmed Transactions</Trans>
                </Typography>
              </MenuItem>
            </Box>
          )}
        </More>
      </Flex>

      <Flex flexDirection="column" gap={2}>
        <Flex gap={1} justifyContent="flex-end">
          <Typography variant="body1" color="textSecondary">
            <Trans>Wallet Status:</Trans>
          </Typography>
          <WalletStatus height />
        </Flex>
        <Flex flexDirection="column" gap={3}>
          <WalletStandardCards walletId={walletId} />
          <WalletCardReceiveAddress walletId={walletId} />
          <WalletHistory walletId={walletId} />
        </Flex>
      </Flex>
    </Flex>
  );
}
