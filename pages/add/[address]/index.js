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
              <img src='/unknown-logo.png' width='40px' height='40px' className={ classes.assetIcon } />
              <div className={ classes.assetDetails }>
                <Typography className={ classes.assetNameText }>Name</Typography>
                <Typography color='secondary' className={ classes.assetNameSubText }>Assets</Typography>
              </div>
              <Typography className={ classes.selectedPoolText } color='secondary'>Selected Pool</Typography>
            </div>
            <div className={ classes.inputContainer }>
              <Typography>Add Reward Token Address</Typography>
            </div>
            <div className={ classes.inputContainer }>
              <Typography>Total Reward Tokens On Offer</Typography>
            </div>
            <Typography>Rewards are valid for 7 days from time created</Typography>
            <Button
              variant='contained'>
              <Typography>Submit</Typography>
            </Button>
          </Paper>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
