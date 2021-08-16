import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Alert } from '@material-ui/lab';
import { Fee, Loading } from '@chia/core';
import styled from 'styled-components';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import {
  Grid,
  TextField,
  TextFieldProps,
  InputAdornment,
} from '@material-ui/core';
import { Check as CheckIcon } from '@material-ui/icons';
import { createFeeRateTransactions } from '../../../modules/incoming';
import { mojo_to_chia_string, chia_to_mojo } from '../../../util/chia';
import addressToPuzzleHash from '../../../util/addressToPuzzleHash';
import useCurrencyCode from '../../../hooks/useCurrencyCode';

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

type FeeType = 'short' | 'medium' | 'long' | 'custom';

type Props = {
  address?: string;
  amount?: string;
  walletId: number;
  name?: string;
  feeName?: string;
  selected?: FeeType;
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
};

export default function WalletFeeRate(props: Props) {
  const { walletId, address, amount, name, feeName, selected: defaultSelected } = props;
  const dispatch = useDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const { control, setError, clearErrors } = useFormContext();
  const [selected, setSelected] = useState<FeeType | undefined>(defaultSelected);
  const [feeRateTransactions, setFeeRateTransaction] = useState<FeeRateTransactions | undefined>(undefined);
  const currencyCode = useCurrencyCode();

  const { 
    field: {
      onChange,
      value,
    },
    fieldState: {
      error,
    },
  } = useController({
    name,
    control,
  });

  const feeValue = useWatch<string>({
    name: feeName,
  });

  async function prepare(walletId: number, address: string, amount: string) {
    try {
      onChange('');
      clearErrors(name);
      setLoading(true);

      if (!address) {
        return;
      }

      const puzzlehash = addressToPuzzleHash(address);


      const addition = {
        puzzlehash,
        amount: chia_to_mojo(amount ?? 0),
      };

      if (feeValue && selected === 'custom') {
        addition.fee_rate = Number.parseFloat(chia_to_mojo(feeValue));
      }

      const data = await dispatch(createFeeRateTransactions(walletId, [addition]));
      if (data.success !== true) {
        throw new Error(data.error);
      }

      setFeeRateTransaction(data);

      if (selected) {
        const { short, medium, long, custom } = data;
        if (selected === 'short') {
          onChange(short?.tx_id);
        }
        if (selected === 'medium') {
          onChange(medium?.tx_id);
        }
        if (selected === 'long') {
          onChange(long?.tx_id);
        }
        if (selected === 'custom') {
          onChange(custom?.tx_id);
        }
      }
    } catch (error) {
      setError(name, {
        type: "manual",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    prepare(walletId, address, amount, feeValue);
  }, [address, amount, feeValue]);

  function handleSelect(type: FeeType, txId: string) {
    setSelected(type);
    onChange(txId);
  }

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!feeRateTransactions) {
    return null;
  }

  const { short, medium, long, custom } = feeRateTransactions;
  const isCustomSelected = selected === 'custom';

  return (
    <Grid spacing={2} container>
      {error && (
        <Grid xs={12} item>
          <Alert severity="error">
            {error.message}
          </Alert>
        </Grid>
      )}
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Fast ~ 30 minutes</Trans>}
          value={`${mojo_to_chia_string(short.fee)} ${currencyCode} (${short.fee_rate}/vbyte)`}
          selected={short.tx_id === value}
          onSelect={() => handleSelect('short', short.tx_id)}
          eventKey={short.tx_id}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Medium ~ 2 hours</Trans>}
          value={`${mojo_to_chia_string(medium.fee)} ${currencyCode} (${medium.fee_rate}/vbyte)`}
          selected={medium.tx_id === value}
          onSelect={() => handleSelect('medium', medium.tx_id)}
          eventKey={medium.tx_id}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <RadioTextField
          color="secondary"
          label={<Trans>Slow ~ 4 hours</Trans>}
          value={`${mojo_to_chia_string(long.fee)} ${currencyCode} (${long.fee_rate}/vbyte)`}
          selected={long.tx_id === value}
          onSelect={() => handleSelect('long', long.tx_id)}
          eventKey={long.tx_id}
          readOnly
          fullWidth
        />
      </Grid>
      <Grid xs={12} item>
        <StyledBase selected={isCustomSelected}>
          <Fee
            color="secondary"
            label={<Trans>Custom Fee</Trans>}
            name={feeName}
            variant="filled"
            onClick={() => handleSelect('custom', custom?.tx_id)}
            endAdornment={isCustomSelected ? <CheckIcon color="primary" /> : undefined}
            fullWidth
          />
        </StyledBase>
      </Grid>
    </Grid>
  );
}

WalletFeeRate.defaultProps = {
  name: 'tx_id',
  feeName: 'fee',
  selected: undefined,
};
