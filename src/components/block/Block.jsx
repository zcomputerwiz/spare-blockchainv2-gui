import React, { useEffect, useState } from 'react';
import {
  Button,
  Paper,
  TableRow,
  Table,
  TableBody,
  TableCell,
  Typography,
  TableContainer,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Trans } from '@lingui/macro';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Card,
  FormatLargeNumber,
  Link,
  Loading,
  TooltipIcon,
  Flex,
  CardKeyValue,
} from '@chia/core';
import {
  unix_to_short_date,
  hex_to_array,
  arr_to_hex,
  sha256,
} from '../../util/utils';
import { getBlockRecord, getBlock } from '../../modules/fullnodeMessages';
import { mojo_to_chia } from '../../util/chia';
import {
  calculatePoolReward,
  calculateBaseFarmerReward,
} from '../../util/blockRewards';
import LayoutMain from '../layout/LayoutMain';
import toBech32m from '../../util/toBech32m';
import BlockTitle from './BlockTitle';
import useCurrencyCode from '../../hooks/useCurrencyCode';

/* global BigInt */

async function computeNewPlotId(block) {
  const { pool_public_key, plot_public_key } =
    block.reward_chain_block.proof_of_space;
  if (!pool_public_key) {
    return undefined;
  }
  let buf = hex_to_array(pool_public_key);
  buf = buf.concat(hex_to_array(plot_public_key));
  const bufHash = await sha256(buf);
  return arr_to_hex(bufHash);
}

export default function Block() {
  const { headerHash } = useParams();
  const history = useHistory();
  const dispatch = useDispatch();
  const [block, setBlock] = useState();
  const [blockRecord, setBlockRecord] = useState();
  const [prevBlockRecord, setPrevBlockRecord] = useState();
  const [newPlotId, setNewPlotId] = useState();
  const [nextSubBlocks, setNextSubBlocks] = useState([]);
  const currencyCode = useCurrencyCode();

  const [error, setError] = useState();
  const [loading, setLoading] = useState(true);

  const hasPreviousBlock = !!blockRecord?.prev_hash && !!blockRecord?.height;
  const hasNextBlock = !!nextSubBlocks.length;

  async function prepareData(headerHash) {
    setLoading(true);

    try {
      setBlock();
      setBlockRecord();
      setPrevBlockRecord();
      setNewPlotId();

      const block = await dispatch(getBlock(headerHash));
      setBlock(block);

      if (block) {
        setNewPlotId(await computeNewPlotId(block));
      }

      const blockRecord = await dispatch(getBlockRecord(headerHash));
      setBlockRecord(blockRecord);

      if (blockRecord?.prev_hash && !!blockRecord?.height) {
        const prevBlockRecord = await dispatch(
          getBlockRecord(blockRecord?.prev_hash),
        );
        setPrevBlockRecord(prevBlockRecord);
      }
    } catch (e) {
      console.log('e', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    prepareData(headerHash);
  }, [headerHash]);

  function handleShowPreviousBlock() {
    const prevHash = blockRecord?.prev_hash;
    if (prevHash && blockRecord?.height) {
      // save current hash
      setNextSubBlocks([headerHash, ...nextSubBlocks]);

      history.push(`/dashboard/block/${prevHash}`);
    }
  }

  function handleShowNextBlock() {
    const [nextSubBlock, ...rest] = nextSubBlocks;
    if (nextSubBlock) {
      setNextSubBlocks(rest);

      history.push(`/dashboard/block/${nextSubBlock}`);
    }
  }

  if (loading) {
    return (
      <LayoutMain title={<Trans>Block</Trans>}>
        <Loading center />
      </LayoutMain>
    );
  }

  if (error) {
    return (
      <LayoutMain title={<Trans>Block Test</Trans>}>
        <Card
          title={
            <BlockTitle>
              <Trans>Block with hash {headerHash}</Trans>
            </BlockTitle>
          }
        >
          <Alert severity="error">{error.message}</Alert>
        </Card>
      </LayoutMain>
    );
  }

  if (!block) {
    return (
      <LayoutMain title={<Trans>Block</Trans>}>
        <BlockTitle>
          <Trans>Block</Trans>
        </BlockTitle>
        <Card>
          <Alert severity="warning">
            <Trans>Block with hash {headerHash} does not exist.</Trans>
          </Alert>
        </Card>
      </LayoutMain>
    );
  }

  const difficulty =
    prevBlockRecord && blockRecord
      ? blockRecord.weight - prevBlockRecord.weight
      : blockRecord?.weight ?? 0;

  const poolReward = mojo_to_chia(calculatePoolReward(blockRecord.height));
  const baseFarmerReward = mojo_to_chia(
    calculateBaseFarmerReward(blockRecord.height),
  );

  const chiaFees = blockRecord.fees
    ? mojo_to_chia(BigInt(blockRecord.fees))
    : '';

  const rows = [
    {
      label: <Trans>Header hash</Trans>,
      value: blockRecord.header_hash,
    },
    {
      label: <Trans>Timestamp</Trans>,
      value: blockRecord.timestamp
        ? unix_to_short_date(blockRecord.timestamp)
        : null,
      tooltip: (
        <Trans>
          This is the time the block was created by the farmer, which is before
          it is finalized with a proof of time
        </Trans>
      ),
    },
    {
      label: <Trans>Height</Trans>,
      value: <FormatLargeNumber value={blockRecord.height} />,
    },
    {
      label: <Trans>Weight</Trans>,
      value: <FormatLargeNumber value={blockRecord.weight} />,
      tooltip: (
        <Trans>
          Weight is the total added difficulty of all sub blocks up to and
          including this one
        </Trans>
      ),
    },
    {
      label: <Trans>Previous Header Hash</Trans>,
      value: (
        <Link onClick={handleShowPreviousBlock}>{blockRecord.prev_hash}</Link>
      ),
    },
    {
      label: <Trans>Difficulty</Trans>,
      value: <FormatLargeNumber value={difficulty} />,
    },
    {
      label: <Trans>Total VDF Iterations</Trans>,
      value: <FormatLargeNumber value={blockRecord.total_iters} />,
      tooltip: (
        <Trans>
          The total number of VDF (verifiable delay function) or proof of time
          iterations on the whole chain up to this sub block.
        </Trans>
      ),
    },
    {
      label: <Trans>Block VDF Iterations</Trans>,
      value: (
        <FormatLargeNumber
          value={
            block.reward_chain_block.challenge_chain_ip_vdf.number_of_iterations
          }
        />
      ),
      tooltip: (
        <Trans>
          The total number of VDF (verifiable delay function) or proof of time
          iterations on this block.
        </Trans>
      ),
    },
    {
      label: <Trans>Proof of Space Size</Trans>,
      value: (
        <FormatLargeNumber
          value={block.reward_chain_block.proof_of_space.size}
        />
      ),
    },
    {
      label: <Trans>Plot Public Key</Trans>,
      value: block.reward_chain_block.proof_of_space.plot_public_key,
    },
    {
      label: <Trans>Pool Public Key</Trans>,
      value: block.reward_chain_block.proof_of_space.pool_public_key,
    },
    {
      label: <Trans>Farmer Puzzle Hash</Trans>,
      value: (
        <Link
          target="_blank"
          href={`https://www.chiaexplorer.com/blockchain/puzzlehash/${blockRecord.farmer_puzzle_hash}`}
        >
          {currencyCode
            ? toBech32m(
                blockRecord.farmer_puzzle_hash,
                currencyCode.toLowerCase(),
              )
            : ''}
        </Link>
      ),
    },
    {
      label: <Trans>Pool Puzzle Hash</Trans>,
      value: (
        <Link
          target="_blank"
          href={`https://www.chiaexplorer.com/blockchain/puzzlehash/${blockRecord.pool_puzzle_hash}`}
        >
          {currencyCode
            ? toBech32m(
                blockRecord.pool_puzzle_hash,
                currencyCode.toLowerCase(),
              )
            : ''}
        </Link>
      ),
    },
    {
      label: <Trans>Plot Id</Trans>,
      value: newPlotId,
      tooltip: (
        <Trans>
          The seed used to create the plot. This depends on the pool pk and plot
          pk.
        </Trans>
      ),
    },
    {
      label: <Trans>Transactions Filter Hash</Trans>,
      value: block.foliage_transaction_block?.filter_hash,
    },
    {
      label: <Trans>Pool Reward Amount</Trans>,
      value: `${poolReward} ${currencyCode}`,
    },
    {
      label: <Trans>Base Farmer Reward Amount</Trans>,
      value: `${baseFarmerReward} ${currencyCode}`,
    },
    {
      label: <Trans>Fees Amount</Trans>,
      value: chiaFees ? `${chiaFees} ${currencyCode}` : '',
      tooltip: (
        <Trans>
          The total transactions fees in this block. Rewarded to the farmer.
        </Trans>
      ),
    },
  ];

  return (
    <LayoutMain title={<Trans>Block</Trans>}>
      <Flex gap={1}>
        <Flex flexGrow={1}>
          <BlockTitle>
            <Typography variant="h5">
              <Trans>
                Block at height {blockRecord.height} in the Chia blockchain
              </Trans>
            </Typography>
          </BlockTitle>
        </Flex>
        <Button
          onClick={handleShowPreviousBlock}
          disabled={!hasPreviousBlock}
        >
          <Trans>Previous</Trans>
        </Button>
        <Button onClick={handleShowNextBlock} disabled={!hasNextBlock}>
          <Trans>Next</Trans>
        </Button>
      </Flex>
      <Card>
        <CardKeyValue rows={rows} size="normal" />
      </Card>
    </LayoutMain>
  );
}
