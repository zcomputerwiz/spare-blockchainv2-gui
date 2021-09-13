import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { Alert } from '@material-ui/lab';
import {
  Button,
  ButtonLoading,
  Amount,
  Form,
  TextField as ChiaTextField,
  AlertDialog,
  Flex,
  Card,
  CardStep,
} from '@chia/core';
import { useDispatch } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import isNumeric from 'validator/es/lib/isNumeric';
import { useForm, useWatch } from 'react-hook-form';
import { ChevronRight as ChevronRightIcon } from '@material-ui/icons';
import {
  Typography,
  Grid,
} from '@material-ui/core';
import {
  send_transaction,
  farm_block,
} from '../../modules/message';
import { chia_to_mojo } from '../../util/chia';
import { openDialog } from '../../modules/dialog';
import { get_transaction_result } from '../../util/transaction_result';
import type { RootState } from '../../modules/rootReducer';
import WalletFeeRate from './fee/WalletFeeRate';
import useWalletSyncingStatus from '../../hooks/useWalletSyncingStatus';
import SyncingStatus from '../../constants/SyncingStatus';
import useCurrencyCode from '../../hooks/useCurrencyCode';
import useWallet from '../../hooks/useWallet';
import WalletStandardHeader from './standard/WalletStandardHeader';
import { sendFeeRateTransaction } from '../../modules/incoming';

type SendTransactionData = {
  address: string;
  amount: string;
  fee: string;
  fee_rate: 'short' | 'medium' | 'long' | 'custom' | '',
  tx_id: string;
};

export default function WalletSend() {
  const { walletId: walletIdParam } = useParams();
  const walletId = Number(walletIdParam);
  const dispatch = useDispatch();
  const currencyCode = useCurrencyCode();
  const history = useHistory();
  const [loading, setLoading] = useState<boolean>(false);

  const methods = useForm<SendTransactionData>({
    shouldUnregister: false,
    defaultValues: {
      address: '',
      amount: '',
      fee: '',
      fee_rate: '',
      tx_id: '',
    },
  });

  const addressValue = useWatch<string>({
    control: methods.control,
    name: 'address',
  });

  const amountValue = useWatch<string>({
    control: methods.control,
    name: 'amount',
  });

  const feeRate = useWatch<string>({
    control: methods.control,
    name: 'fee_rate',
  });

  const syncingStatus = useWalletSyncingStatus();
  const isSynced = syncingStatus === SyncingStatus.SYNCED;

/*
  const { sending_transaction, send_transaction_result } = wallet;

  const result = get_transaction_result(send_transaction_result);

  const resultMessage = result.message;
  const resultSeverity = result.success ? 'success' : 'error';
*/

  async function handleSubmit(values: SendTransactionData) {
    if (loading) {
      return;
    }

    try {
      let { amount, address } = values;
      const { tx_id, fee, fee_rate } = values;

      setLoading(true);
  
      if (!isSynced) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>Please finish wallet syncing before making a transaction</Trans>
            </AlertDialog>,
          ),
        );
        return;
      }
  
      if (!fee_rate || !tx_id) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>Please select network fee or enter custom fee value</Trans>
            </AlertDialog>,
          ),
        );
        return;
      }
  
      amount = amount.trim();
      if (!isNumeric(amount)) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>Please enter a valid numeric amount</Trans>
            </AlertDialog>,
          ),
        );
        return;
      }
  
      if (address.includes('colour')) {
        dispatch(
          openDialog(
            <AlertDialog>
              <Trans>
                Cannot send chia to coloured address. Please enter a chia
                address.
              </Trans>
            </AlertDialog>,
          ),
        );
        return;
      }
  
      if (address.slice(0, 12) === 'chia_addr://') {
        address = address.slice(12);
      }
      if (address.startsWith('0x') || address.startsWith('0X')) {
        address = address.slice(2);
      }
  
      await dispatch(sendFeeRateTransaction(tx_id));
  
      methods.reset();

      history.goBack();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={1}>
        <WalletStandardHeader
          title={(
              <Typography variant="h5">
                <Trans>Send {currencyCode}</Trans>
              </Typography>
          )}
          back
        />
        <Flex flexDirection="column" gap={3}>
          <CardStep
            step="1"
            title={<Trans>Basic Information</Trans>}
            tooltip={
              <Trans>
                On average there is one minute between each transaction block. Unless
                there is congestion you can expect your transaction to be included in
                less than a minute.
              </Trans>
            }
          >
            <Grid spacing={2} container>
              <Grid xs={12} item>
                <ChiaTextField
                  name="address"
                  variant="filled"
                  color="secondary"
                  fullWidth
                // disabled={sending_transaction}
                  label={<Trans>Address / Puzzle Hash</Trans>}
                />
              </Grid>
              <Grid xs={12} item>
                <Amount
                  id="filled-secondary"
                  variant="filled"
                  color="secondary"
                  name="amount"
              //   disabled={sending_transaction}
                  label={<Trans>Amount</Trans>}
                  fullWidth
                />
              </Grid>
            </Grid>
          </CardStep>

          <CardStep
            step="2"
            title={<Trans>Network Fee</Trans>}
            disabled
          >
            <Typography variant="subtitle1">
              <Trans>
                Chia transactions include a small fee for every transaction.
                The higher the fee, the faster your transaction will be processed.
              </Trans>
            </Typography>
            <WalletFeeRate 
              walletId={walletId}
              address={addressValue}
              amount={amountValue}
            />
          </CardStep>

          <Flex gap={1}>
            <ButtonLoading
              variant="contained"
              color="primary"
              type="submit"
              loading={loading}
            >
              <Trans>Send</Trans>
            </ButtonLoading>
          </Flex>
        </Flex>
      </Flex>
    </Form>
  );
}
