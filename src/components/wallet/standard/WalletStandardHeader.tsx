import React, { ReactNode } from 'react';
import { Trans } from '@lingui/macro';
import {
  More,
  Flex,
  ConfirmDialog,
  Link,
} from '@chia/core';
import styled from 'styled-components';
import { useHistory } from 'react-router';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  ListItemIcon,
  MenuItem,
} from '@material-ui/core';
import { Delete as DeleteIcon, ArrowBackIos as ArrowBackIosIcon } from '@material-ui/icons';
import { deleteUnconfirmedTransactions } from '../../../modules/incoming';
import useOpenDialog from '../../../hooks/useOpenDialog';
import WalletStatus from '../WalletStatus';

const BackIcon = styled(ArrowBackIosIcon)`
  cursor: pointer;
`;

type Props = {
  walletId: number;
  actions?: ReactNode;
  title?: ReactNode;
  back?: boolean;
};

export default function WalletStandardHeader(props: Props) {
  const { walletId, actions, title, back } = props;
  const dispatch = useDispatch();
  const openDialog = useOpenDialog();
  const history = useHistory();

  function handleGoBack() {
    history.goBack();
  }

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
    <Flex gap={1} flexDirection="column">
      <Flex gap={1} alignItems="center">
        <Flex flexGrow={1} gap={1} alignItems="center">
          {back ? (
            <BackIcon onClick={handleGoBack} fontSize="medium" />
          ) : (
            <Link to="/dashboard/wallets" color="textPrimary">
              <Typography variant="h5">
                <Trans>Chia Wallet</Trans>
              </Typography>
            </Link>
          )}
          {title}
        </Flex>
        {actions}
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
      <Flex gap={1} justifyContent="flex-end">
        <Typography variant="body1" color="textSecondary">
          <Trans>Wallet Status:</Trans>
        </Typography>
        <WalletStatus height />
      </Flex>
    </Flex>
  );
}

WalletStandardHeader.defaultProps = {
  actions: undefined,
  title: undefined,
  back: false,
};
