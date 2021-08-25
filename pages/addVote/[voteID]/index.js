import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';


import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';

import Layout from '../../../components/layout/layout.js';
import Header from '../../../components/header';
import SearchIcon from '@material-ui/icons/Search';

import classes from './define.module.css';

import stores from '../../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, INCENTIVES_CONFIGURED, SEARCH_TOKEN, SEARCH_TOKEN_RETURNED, ADD_VOTE_REWARD, ADD_VOTE_REWARD_RETURNED } from '../../../stores/constants';

import { formatCurrency, formatAddress } from '../../../utils';

const searchTheme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '16px'
  },
  typography: {
    fontFamily: [
      'Inter',
      'Arial',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    body1: {
      fontSize: '12px'
    }
  },
  overrides: {
    MuiPaper: {
      elevation1: {
        "box-shadow": '0px 7px 7px #0000000A;',
        "-webkit-box-shadow": '0px 7px 7px #0000000A;',
        "-moz-box-shadow": '0px 7px 7px #0000000A;',
      }
    },
    MuiInputBase: {
      input: {
        fontSize: '14px'
      },
    },
    MuiOutlinedInput: {
      input: {
        padding: '24px 20px'
      },
      notchedOutline: {
        borderColor: "#FFF",
      }
    },
  },
});

function Voting({ changeTheme, theme }) {
  const router = useRouter();

  const [ web3, setWeb3 ] = useState(null)

  const [ loading, setLoading ] = useState(false);
  const [ account, setAccount ] = useState(null);

  const [ searching, setSearching ] = useState(false)
  const [ search, setSearch ] = useState('')
  const [ vote, setVote ] = useState([])

  const [ rewardTokenAddress, setRewardTokenAddress ] = useState('')
  const [ rewardAmount, setRewardAmount ] = useState('')
  const [ rewardAmountError, setRewardAmountError ] = useState(false)
  const [ rewardToken, setRewardToken ] = useState()

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(async function () {
    const accountChanged = async () => {
      setAccount(stores.accountStore.getStore('account'))
      setWeb3(await stores.accountStore.getWeb3Provider())
    }

    const configureReturned = async () => {
      const gs = stores.incentivesStore.getStore('votes')
      const v = gs.filter((gg) => { return gg.index == parseInt(router.query.voteID) });
      if(v.length > 0) {
        setVote(v[0])
      }
      setWeb3(await stores.accountStore.getWeb3Provider())
    }

    const searchReturned = (token) => {
      setSearching(false)
      setRewardToken(token)
    }

    const addRewardReturned = () => {
      setLoading(false)
      router.push(`/`);
    }

    const errorReturned = () => {
      setLoading(false)
    }

    setAccount(stores.accountStore.getStore('account'))
    stores.emitter.on(ERROR, errorReturned)
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(INCENTIVES_CONFIGURED, configureReturned)
    stores.emitter.on(SEARCH_TOKEN_RETURNED, searchReturned)
    stores.emitter.on(ADD_VOTE_REWARD_RETURNED, addRewardReturned);

    const gs = stores.incentivesStore.getStore('votes')
    console.log(router.query)
    const v = gs.filter((gg) => { return gg.index == parseInt(router.query.voteID) });
    if(v.length > 0) {
      setVote(v[0])
    }
    setWeb3(await stores.accountStore.getWeb3Provider())

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned)
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_CONFIGURED, configureReturned);
      stores.emitter.removeListener(SEARCH_TOKEN_RETURNED, searchReturned);
      stores.emitter.removeListener(ADD_VOTE_REWARD_RETURNED, addRewardReturned);
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onSubmit = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: ADD_VOTE_REWARD, content: { rewardToken, rewardAmount, vote } })
  }

  const onBackClicked = () => {
    router.push(`/addVote`);
  }

  const onRewardTokenAddressChanged = (e) => {
    setRewardTokenAddress(e.target.value)
  }

  const onRewardAmountChanged = (e) => {
    let inputAmount = e.target.value

    if(isNaN(inputAmount) || BigNumber(inputAmount).times(10**rewardToken.decimals).gt(rewardToken.balance)) {
      setRewardAmountError(true)
    } else {
      setRewardAmountError(false)
    }

    setRewardAmount(e.target.value)
  }

  const onSearch = () => {
    setSearching(true)
    stores.dispatcher.dispatch({ type: SEARCH_TOKEN, content: { address: rewardTokenAddress }  })
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
        <div className={ classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
            <Typography className={ classes.selectPool }>Define the Reward</Typography>
            <Typography className={ classes.choosePool }>Add reward token address & specify the amount to be rewarded...</Typography>
          </div>
          <Paper className={ classes.actionContainer }>
            <div className={ classes.selectedField }>
              <img src={ '/Curve.png' } width='55px' height='55px' className={ classes.assetIcon } />
              <div className={ classes.assetDetails }>
                <Typography className={ classes.assetNameText }>Proposal #{ vote ? vote.index : ''}</Typography>
                <Typography color='textSecondary' className={ classes.assetNameSubText }>{ vote ? `https://dao.curve.fi/vote/ownership/${vote.index}` : '' }</Typography>
              </div>
              <Typography className={ classes.selectedPoolText } color='textSecondary'>Selected Proposal</Typography>
            </div>
            <div className={ classes.inputContainer }>
              <Typography className={ classes.inputFieldTitle }>Add Reward Token Address:</Typography>
              <TextField
                className={ classes.outlinedInput }
                variant="outlined"
                fullWidth
                placeholder="0x00000000000000"
                value={ rewardTokenAddress }
                onChange={ onRewardTokenAddressChanged }
                InputProps={{
                  endAdornment: (
                    <Button
                      size='large'
                      variant='contained'
                      color='primary'
                      className={ classes.inputButton }
                      onClick={ onSearch }
                      disabled={ searching || !web3 || !web3.utils || !web3.utils.isAddress(rewardTokenAddress) }
                      >
                      <Typography>{ searching ? 'Searching ...' : 'Search'}</Typography>
                    </Button>
                  )
                }}
              />
            </div>
            <div className={ classes.inputContainer }>
              <Typography className={ classes.inputFieldTitle }>Total Reward Tokens On Offer:</Typography>
              <TextField
                className={ classes.outlinedInput }
                variant="outlined"
                fullWidth
                placeholder="0.00"
                value={ rewardAmount }
                onChange={ onRewardAmountChanged }
                error={ rewardAmountError }
                disabled={!rewardToken}
                InputProps={{
                  endAdornment: (
                    <div>
                      <Typography color='textSecondary' className={ classes.availableText }>Available</Typography>
                      <Typography color='textSecondary' className={ classes.availableText }>{ rewardToken && formatCurrency(BigNumber(rewardToken.balance).div(10**rewardToken.decimals)) }</Typography>
                    </div>
                  ),
                  startAdornment: (
                    <div>
                      {
                        rewardToken && rewardToken.address &&
                        <img width={30} height={30} style={{marginRight: 12}} src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3 && web3.utils ? web3.utils.toChecksumAddress(rewardToken.address) : rewardToken.address}/logo.png`} />
                      }
                    </div>
                  )
                }}
              />
            </div>
            <Typography className={ classes.rewardText }>Rewards are valid for 7 days from time created</Typography>
            <div className={ classes.bigButton }>
              <Button
                size='large'
                variant='contained'
                color='primary'
                fullWidth
                onClick={ onSubmit }
                disabled={ loading }
                >
                <Typography>{ loading ? 'Submitting ...' : 'Submit'}</Typography>
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
