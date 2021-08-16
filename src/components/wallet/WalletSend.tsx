import React /* , { ReactNode } */ from 'react';
import { Trans } from '@lingui/macro';
import { Alert } from '@material-ui/lab';
import {
  Button,
  Amount,
  Form,
  TextField as ChiaTextField,
  AlertDialog,
  Flex,
  Card,
  CardStep,
} from '@chia/core';
import { useDispatch, useSelector } from 'react-redux';
import isNumeric from 'validator/es/lib/isNumeric';
import { useForm, useWatch } from 'react-hook-form';
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
import config from '../../config/config';
import type { RootState } from '../../modules/rootReducer';
import WalletFeeRate from './fee/WalletFeeRate';
import { useParams } from 'react-router';
import useWalletSyncingStatus from '../../hooks/useWalletSyncingStatus';
import SyncingStatus from '../../constants/SyncingStatus';
import useCurrencyCode from '../../hooks/useCurrencyCode';
import useWallet from '../../hooks/useWallet';

type SendTransactionData = {
  address: string;
  amount: string;
  fee: string;
  tx_id: string;
};

export default function WalletSend() {
  const { walletId: walletIdParam } = useParams();
  const walletId = Number(walletIdParam);
  const dispatch = useDispatch();
  const currencyCode = useCurrencyCode();

  const methods = useForm<SendTransactionData>({
    shouldUnregister: false,
    defaultValues: {
      address: '',
      amount: '',
      fee: '',
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

  const txId = useWatch<string>({
    control: methods.control,
    name: 'tx_id',
  });

  const showNetworkFee = addressValue;

  const { wallet, loading: loadingWallet } = useWallet(walletId);
  const syncingStatus = useWalletSyncingStatus();

  const canSubmit = syncingStatus === SyncingStatus.SYNCED && txId && !loadingWallet && !!wallet;
/*
  const { sending_transaction, send_transaction_result } = wallet;

  const result = get_transaction_result(send_transaction_result);

  const resultMessage = result.message;
  const resultSeverity = result.success ? 'success' : 'error';
*/
  function farm() {
    if (addressValue) {
      dispatch(farm_block(addressValue));
    }
  }

  async function handleSubmit(values: SendTransactionData) {
    let { amount, address, tx_id, fee } = values;

    if (syncing) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Please finish syncing before making a transaction</Trans>
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

    fee = fee.trim();
    if (!isNumeric(fee)) {
      dispatch(
        openDialog(
          <AlertDialog>
            <Trans>Please enter a valid numeric fee</Trans>
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

    const amountValue = Number.parseFloat(chia_to_mojo(amount));
    const feeValue = Number.parseFloat(chia_to_mojo(fee));

    // dispatch(send_transaction(walletId, amountValue, feeValue, address));

    methods.reset();
  }

  return (
    <Form methods={methods} onSubmit={handleSubmit}>
      <Flex flexDirection="column" gap={3}>
        <CardStep
          step="1"
          title={<Trans>Send {currencyCode}</Trans>}
          tooltip={
            <Trans>
              On average there is one minute between each transaction block. Unless
              there is congestion you can expect your transaction to be included in
              less than a minute.
            </Trans>
          }
        >
          {/* resultMessage && (
            <Alert severity={resultSeverity}>
              {resultMessage}
            </Alert>
          ) */}
          
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

        {showNetworkFee && (
          <CardStep
            step="2"
            title={<Trans>Network Fee</Trans>}
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
        )}

        <Flex gap={1}>
          {!!config.local_test && (
            <Button onClick={farm} variant="outlined">
              <Trans>Farm</Trans>
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            type="submit"
           // disabled={canSubmit}
          >
            <Trans>Send</Trans>
          </Button>
        </Flex>
      </Flex>
    </Form>
  );
}
