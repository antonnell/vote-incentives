import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';

import Layout from '../../../components/layout/layout.js';
import Header from '../../../components/header';
import SearchIcon from '@material-ui/icons/Search';

import classes from './define.module.css';

import stores from '../../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, INCENTIVES_CONFIGURED } from '../../../stores/constants';

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

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [ search, setSearch ] = useState('')
  const [ gauges, setGauges ] = useState([])

  const [ rewardToken, setRewardToken ] = useState('')


  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(function () {
    const accountChanged = () => {
      setAccount(stores.accountStore.getStore('account'))
    }

    const configureReturned = () => {
      setGauges(stores.incentivesStore.getStore('gauges'))
    }

    setAccount(stores.accountStore.getStore('account'))
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(INCENTIVES_CONFIGURED, configureReturned)

    setGauges(stores.incentivesStore.getStore('gauges'))

    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_CONFIGURED, configureReturned)
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onChoose = (pool) => {
    router.push(`/add/${pool.gaugeAddress}`);
  }

  const onBackClicked = () => {
    router.push(`/`);
  }

  const onRewardTokenChanged = (e) => {
    setRewardToken(e.target.value)
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
              <img src='/unknown-logo.png' width='55px' height='55px' className={ classes.assetIcon } />
              <div className={ classes.assetDetails }>
                <Typography className={ classes.assetNameText }>Name</Typography>
                <Typography color='textSecondary' className={ classes.assetNameSubText }>0x123abc...123</Typography>
              </div>
              <Typography className={ classes.selectedPoolText } color='textSecondary'>Selected Pool</Typography>
            </div>
            <div className={ classes.inputContainer }>
              <Typography className={ classes.inputFieldTitle }>Add Reward Token Address:</Typography>
              <TextField
                className={ classes.outlinedInput }
                variant="outlined"
                fullWidth
                placeholder="0x00000000000000"
                value={ rewardToken }
                onChange={ onRewardTokenChanged }
                InputProps={{
                  endAdornment: (
                    <Button
                      size='large'
                      variant='contained'
                      color='primary'
                      className={ classes.inputButton }
                      >
                      <Typography>Submit</Typography>
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
                value={ rewardToken }
                onChange={ onRewardTokenChanged }
                InputProps={{
                  endAdornment: (
                    <div>
                      <Typography color='textSecondary' className={ classes.availableText }>Available</Typography>
                      <Typography color='textSecondary' className={ classes.availableText }>0.00</Typography>
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
                >
                <Typography>Submit</Typography>
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
