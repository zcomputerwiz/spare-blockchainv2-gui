import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from '@material-ui/lab';
import { Fee } from '@chia/core';
import styled from 'styled-components';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Trans, t, plural } from '@lingui/macro';
import {
  Grid,
  TextField,
  TextFieldProps,
  InputAdornment,
  Typography,
} from '@material-ui/core';
import { Check as CheckIcon } from '@material-ui/icons';
import { createFeeRateTransactions } from '../../../modules/incoming';
import { mojo_to_chia_string, chia_to_mojo } from '../../../util/chia';
import addressToPuzzleHash from '../../../util/addressToPuzzleHash';
import useCurrencyCode from '../../../hooks/useCurrencyCode';
import useWalletSyncingStatus from '../../../hooks/useWalletSyncingStatus';
import SyncingStatus from '../../../constants/SyncingStatus';

const SECONDS_PER_BLOCK = (24 * 60 * 60) / 4608; // 0.3125
// const SHORT_SECONDS = SECONDS_PER_BLOCK * 10; // 3 minutes
// const MEDIUM_SECONDS = SECONDS_PER_BLOCK * 60; // 18 minutes
// const LONG_SECONDS = SECONDS_PER_BLOCK * 600;  // 180 minutes

const StyledBase = styled.div`
  input {
    ${({ readOnly }) => readOnly ? 'cursor: pointer;' : ''}
  }

  & .MuiTextField-root {
    border-width: 2px;
    border-color: transparent;
    border-style: solid;
    ${({ readOnly }) => readOnly ? 'cursor: pointer;' : ''}
  }

  ${({ selected }) => selected ? `
    & .MuiTextField-root {
      border-color: #3AAC59;
      border-width: 2px;
      border-style: solid;
      border-radius: 4px 4px 0 0; 
    }

    & .MuiFilledInput-underline:before {
      border-bottom: 0px solid transparent;
    }

    & .MuiFilledInput-underline:after {
      border-bottom: 0px solid transparent;
    }
  ` : ''}
`;

const StyledRadioTextField = styled(TextField)`
  border-width: 2px;
  border-color: transparent;
  border-style: solid;
  ${({ readOnly }) => readOnly ? 'cursor: pointer;' : ''}

  input {
    ${({ readOnly }) => readOnly ? 'cursor: pointer;' : ''}
  }

  ${({ selected }) => selected ? `
    border-color: #3AAC59;
    border-width: 2px;
    border-style: solid;
    border-radius: 4px 4px 0 0; 

    & .MuiFilledInput-underline:before {
      border-bottom: 0px solid transparent;
    }

    & .MuiFilledInput-underline:after {
      border-bottom: 0px solid transparent;
    }
  ` : ''}
`;

type RadioTextFieldProps = TextFieldProps & {
  selected?: boolean;
  onSelect?: (eventKey: any) => void;
  eventKey?: any;
  readOnly?: boolean;
};

function RadioTextField(props: RadioTextFieldProps) {
  const { selected, eventKey, onSelect, readOnly, ...rest } = props;

  function handleClick() {
    if (onSelect) {
      onSelect(eventKey);
    }
  }

  return (
    <StyledRadioTextField
      onClick={handleClick}
      selected={selected}
      readOnly={readOnly}
      inputProps={{
        readOnly: readOnly,
      }}
      InputProps={{
        endAdornment: selected ? (
          <InputAdornment position="end">
            <CheckIcon color="primary" />
          </InputAdornment>
        ) : null,
      }}
      {...rest}
    />
  );
}

RadioTextField.defaultProps = {
  selected: false,
  variant: 'filled',
};

type FeeRateType = 'short' | 'medium' | 'long' | 'custom';

type Props = {
  address?: string;
  amount?: string;
  walletId: number;
  name?: string;
  feeName?: string;
  feeRateName?: string;
};

type FeeRateTransaction = {
  tx_id: string;
  fee: number;
  fee_rate: string;
}

type FeeRateTransactions = {
  short: FeeRateTransaction;
  medium: FeeRateTransaction;
  long: FeeRateTransaction;
  custom?: FeeRateTransaction;
};

function getFee(feeRateTransactions?: FeeRateTransactions, feeRate?: FeeRateType): number {
  if (feeRateTransactions) {
    const { short, medium, long, custom } = feeRateTransactions;
    if (feeRate === 'short' && short) {
      return short.fee;
    }
    if (feeRate === 'medium' && medium) {
      return medium.fee;
    }
    if (feeRate === 'long' && long) {
      return long.fee;
    }
    if (feeRate === 'custom' && custom) {
      return custom.fee;
    }
  }

  return 0;
}

export default function WalletFeeRate(props: Props) {
  const { walletId, address, amount, name, feeName, feeRateName } = props;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [feeRateTransactions, setFeeRateTransactions] = useState<FeeRateTransactions | undefined>();
  const { control, setError, clearErrors } = useFormContext();
  const currencyCode = useCurrencyCode();
  const syncingStatus = useWalletSyncingStatus();
  const isSynced = syncingStatus === SyncingStatus.SYNCED;

  const { 
    field: {
      onChange: setTxId,
    },
    fieldState: {
      error,
    },
  } = useController({
    name,
    control,
  });

  const { 
    field: {
      onChange: setSelectedFeeRate,
      value: selectedFeeRate,
    },
  } = useController({
    name: feeRateName,
    control,
  });

  const canSelect = isSynced && !!address;

  const amountMojos = chia_to_mojo(amount ?? 0);
  const feeMojos = getFee(feeRateTransactions, selectedFeeRate);
  const totalSpendMojos = amountMojos + feeMojos;

  const feeValue = useWatch<string>({
    name: feeName,
  });

  async function prepare(walletId: number, address: string, amount: string) {
    try {
      if (!address || !isSynced) {
        return;
      }

      clearErrors([name, 'address']);
      setLoading(true);
      setFeeRateTransactions(undefined);

      const puzzlehash = addressToPuzzleHash(address);

      const addition = {
        puzzlehash,
        amount: amountMojos,
      };

      const customFeeRate = feeValue && selectedFeeRate === 'custom'
        ? Number.parseFloat(chia_to_mojo(feeValue))
        : undefined;

      const data = await dispatch(createFeeRateTransactions(walletId, [addition], customFeeRate));
      if (data.success !== true) {
        throw new Error(data.error);
      }

      setFeeRateTransactions(data);
    } catch (error) {
      const fieldName = error.code === 'INVALID_ADDRESS' ? 'address' : name;
      setError(fieldName, {
        type: 'manual',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function updateTxId(feeRate: FeeRateType, feeRateTransactions?: FeeRateTransactions) {
    setTxId('');

    if (feeRateTransactions) {
      const { short, medium, long, custom } = feeRateTransactions;
      if (feeRate === 'short' && short?.tx_id) {
        setTxId(short.tx_id);
      }
      if (feeRate === 'medium' && medium?.tx_id) {
        setTxId(medium?.tx_id);
      }
      if (feeRate === 'long' && long?.tx_id) {
        setTxId(long?.tx_id);
      }
      if (feeRate === 'custom' && custom?.tx_id) {
        setTxId(custom?.tx_id);
      }
    }
  }

  useEffect(() => {
    prepare(walletId, address, amount, feeValue);
  }, [walletId, address, amount, feeValue, isSynced]);

  useEffect(() => {
    updateTxId(selectedFeeRate, feeRateTransactions);
  }, [selectedFeeRate, feeRateTransactions]);

  function handleSelect(type: FeeRateType) {
    if (canSelect) {
      setSelectedFeeRate(type);
    }
  }

  function formatFeeRateTransaction(feeRateTransaction: FeeRateTransaction, loading?: boolean, disabled?: boolean): string {
    if (loading) {
      return t`Loading...`;
    }

    if (!feeRateTransaction || disabled) {
      return t`Not Available`;
    }

    return t`${mojo_to_chia_string(feeRateTransaction.fee)} ${currencyCode} (${plural(feeRateTransaction.fee_rate, { one: '# mojo', other: '# mojos' })}/vbyte)`;
  }

  const { short, medium, long } = feeRateTransactions ?? {};
  const isCustomSelected = selectedFeeRate === 'custom';

  const showedInfo = 
    (!isSynced && <Trans>You need to wait for wallet synchronisation</Trans>)
     || (!address && <Trans>You need to enter address first</Trans>);

  return (
    <Grid spacing={2} container>
      {error && (
        <Grid xs={12} item>
          <Alert severity="error">
            {error.message}
          </Alert>
        </Grid>
      )}
      {!error && showedInfo && (
        <Grid xs={12} item>
          <Alert severity="info">
            {showedInfo}
          </Alert>
        </Grid>
      )}
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Fast ~ 3 minutes</Trans>}
          value={formatFeeRateTransaction(short, loading, !canSelect)}
          selected={selectedFeeRate === 'short'}
          onSelect={() => handleSelect('short')}
          disabled={!canSelect}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Medium ~ 20 minutes</Trans>}
          value={formatFeeRateTransaction(medium, loading, !canSelect)}
          selected={selectedFeeRate === 'medium'}
          onSelect={() => handleSelect('medium')}
          disabled={!canSelect}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Slow ~ 3 hours</Trans>}
          value={formatFeeRateTransaction(long, loading, !canSelect)}
          selected={selectedFeeRate === 'long'}
          onSelect={() => handleSelect('long')}
          disabled={!canSelect}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <StyledBase selected={isCustomSelected}>
          <Fee
            color="secondary"
            label={<Trans>Custom Fee Rate</Trans>}
            name={feeName}
            variant="filled"
            onClick={() => handleSelect('custom')}
            endAdornment={isCustomSelected ? <CheckIcon color="primary" /> : undefined}
            disabled={!canSelect}
            fullWidth
          />
        </StyledBase>
      </Grid>
      {feeRateTransactions && (
        <Grid xs={12} item>
          <Typography color="textPrimary" variant="body2">
            <Trans>
              Total Spend: {mojo_to_chia_string(totalSpendMojos)} {currencyCode} (including {mojo_to_chia_string(feeMojos)} {currencyCode} of transaction fees)
            </Trans>
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}

WalletFeeRate.defaultProps = {
  name: 'tx_id',
  feeName: 'fee',
  feeRateName: 'fee_rate',
};
