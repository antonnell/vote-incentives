import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';
import * as moment from 'moment';
import BigNumber from 'bignumber.js';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import SearchIcon from '@material-ui/icons/Search';

import classes from './add.module.css';

import stores from '../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, INCENTIVES_CONFIGURED } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';


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
        padding: '34px 50px'
      },
      notchedOutline: {
        borderColor: "transparent",
      },
      adornedEnd: {
        paddingRight: '40px'
      },
      adornedStart: {
        paddingLeft: '40px'
      }
    },
  },
});

function Voting({ changeTheme, theme }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [ search, setSearch ] = useState('')
  const [ votes, setVotes ] = useState([])

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(function () {
    const accountChanged = () => {
      setAccount(stores.accountStore.getStore('account'))
    }

    const configureReturned = () => {
      setVotes(stores.incentivesStore.getStore('votes'))
    }

    setAccount(stores.accountStore.getStore('account'))
    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(INCENTIVES_CONFIGURED, configureReturned)

    setVotes(stores.incentivesStore.getStore('votes'))

    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_CONFIGURED, configureReturned)
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onChoose = (vote) => {
    router.push(`/addVote/${vote.index}`);
  }

  const onBackClicked = () => {
    router.push(`/`);
  }

  const navToCurve = (id) => {
    window.open('https://dao.curve.fi/vote/ownership/'+id, '_blank')
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ classes.container }>
        <div className={ classes.headContainer }>
          <div className={ classes.headContainerContent }>
            <Header changeTheme={ changeTheme } variant={2} backClicked={ onBackClicked }/>
            <Typography className={ classes.selectPool }>Select a Proposal</Typography>
            <Typography className={ classes.choosePool }>Choose a proposal that you would like to offer rewards for below...</Typography>
          </div>
          <div className={ classes.searchField }>
            <ThemeProvider theme={searchTheme}>
              <Paper className={ classes.searchPaper }>
                <TextField
                  fullWidth
                  className={ classes.searchContainer }
                  variant="outlined"
                  placeholder="1, 2, 61"
                  value={ search }
                  onChange={ onSearchChanged }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">
                      <SearchIcon fontSize="medium"  />
                    </InputAdornment>,
                    startAdornment: <InputAdornment position="start">
                      <Typography className={ classes.searchInputAdnornment }>
                        Search Vote:
                      </Typography>
                    </InputAdornment>
                  }}
                />
              </Paper>
            </ThemeProvider>
          </div>
        </div>
        <div className={ classes.tableContainer }>
          <div className={ theme.palette.type === 'dark' ? classes.tableHeaderDark : classes.tableHeader }>
            <div className={ classes.tableHeaderRow }>
              <div className={ classes.poolRow }>
                <Typography className={ `${classes.tableHeaderText} ${classes.poolHeaderText}` }>Vote ID</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>Votes</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>Quorum</Typography>
              </div>
              <div className={ classes.typeRow }>
                <Typography className={ classes.tableHeaderText }>Vote Ends</Typography>
              </div>
              <div className={ classes.actionRow }>
                <Typography className={ classes.tableHeaderText }>Action</Typography>
              </div>
            </div>
          </div>
          <div className={ classes.tableBody }>
            { votes && votes.length > 0 &&
              votes.filter((vote) => {
                return vote.vote.open
              }).filter((vote) => {
                if(search) {
                  return vote.index == search
                }

                return true
              }).map((vote) => {

                let yesPerc = BigNumber(vote.vote.yea).times(100).div(BigNumber(vote.vote.yea).plus(vote.vote.nay)).toFixed(2)
                let quorumPerc = BigNumber(vote.vote.yea).plus(vote.vote.nay).times(100).div(vote.vote.votingPower).toFixed(2)

                return (
                  <div className={ classes.tableRow }>
                    <div className={ classes.poolRow } onClick={ () => { navToCurve(vote.index) } }>
                      <img src={ '/Curve.png' } alt='' width='40px' height='40px' className={ classes.assetIcon } />
                      <Typography className={ classes.nameText }>{vote.index}</Typography>
                    </div>
                    <div className={ classes.typeRow }>
                      <div className={ classes.bar }>
                        <div className={ classes.yeas } style={{ width: yesPerc+'%' }}></div>
                        <div className={ classes.quorumRequired } style={{ left: BigNumber(vote.vote.supportRequired).div(10**16).toNumber()+'%' }}></div>
                      </div>
                      <Typography>Yea: { formatCurrency(yesPerc) }%</Typography>
                    </div>
                    <div className={ classes.typeRow }>
                      <div className={ classes.bar }>
                        <div className={ classes.yeas } style={{ width: quorumPerc+'%' }}></div>
                        <div className={ classes.quorumRequired } style={{ left: BigNumber(vote.vote.minAcceptQuorum).div(10**16).toNumber()+'%' }}></div>
                      </div>
                      <Typography >{ formatCurrency(quorumPerc) }%</Typography>
                    </div>
                    <div className={ classes.typeRow }>
                      <Typography className={ classes.typeText }>{moment(vote.vote.timestamp).add(1, 'w').format("MMMM Do YYYY")}</Typography>
                    </div>
                    <div className={ classes.actionRow }>
                      <Button
                        variant='outlined'
                        size='small'
                        color='primary'
                        onClick={ () => { onChoose(vote) } }
                        className={ classes.chooseButton }
                        >
                        <Typography className={ classes.buttonText }>Choose Proposal</Typography>
                      </Button>
                    </div>
                  </div>
                )
              })


            }
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
