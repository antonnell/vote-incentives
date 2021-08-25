import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as moment from 'moment';

import { Typography, Paper, Button, CircularProgress, TextField, InputAdornment } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { withTheme, createTheme, ThemeProvider } from '@material-ui/core/styles';

import Layout from '../../components/layout/layout.js';
import Header from '../../components/header';
import Footer from '../../components/footer';
import RewardCard from '../../components/rewardCard';
import VoteRewardCard from '../../components/voteRewardCard';
import Unlock from '../../components/unlock/unlock.js';

import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import SearchIcon from '@material-ui/icons/Search';
import AppsIcon from '@material-ui/icons/Apps';
import ListIcon from '@material-ui/icons/List';
import AddIcon from '@material-ui/icons/Add';

import BigNumber from 'bignumber.js';

import classes from './voting.module.css';

import stores from '../../stores/index.js';
import { ERROR, ACCOUNT_CHANGED, CONNECT_WALLET, GET_INCENTIVES_BALANCES, INCENTIVES_BALANCES_RETURNED } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';

const searchTheme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '10px'
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

const searchThemeDark = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#2F80ED',
    },
  },
  shape: {
    borderRadius: '10px'
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

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [ web3, setWeb3 ] = useState(null)
  const [ loading, setLoading ] = useState(true);
  const [ account, setAccount ] = useState(null);
  const [ search, setSearch ] = useState('')
  const [ searchError, setSearchError ] = useState(false)
  const [ rewards, setRewards ] = useState([])
  const [ voteRewards, setVoteRewards ] = useState([])

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  useEffect(async function () {
    const accountChanged = async () => {
      setAccount(stores.accountStore.getStore('account'))
      setWeb3(await stores.accountStore.getWeb3Provider())
    }

    const balanceReturned = () => {
      setRewards(stores.incentivesStore.getStore('rewards'))
      setVoteRewards(stores.incentivesStore.getStore('voteRewards'))
      setLoading(false)
    }

    setAccount(stores.accountStore.getStore('account'))
    setWeb3(await stores.accountStore.getWeb3Provider())

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(INCENTIVES_BALANCES_RETURNED, balanceReturned)

    setRewards(stores.incentivesStore.getStore('rewards'))
    setVoteRewards(stores.incentivesStore.getStore('voteRewards'))

    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(INCENTIVES_BALANCES_RETURNED, balanceReturned)
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const onSearch = (event) => {
    setSearchError(false)

    if (event.keyCode === 13) {
      if(web3.utils.isAddress(search)) {
        setRewards([])
        setVoteRewards([])
        stores.dispatcher.dispatch({ type: GET_INCENTIVES_BALANCES, content: { address: search } })
      } else {
        setSearchError(true)
      }
    }

  }

  const onAddReward = () => {
    router.push('/add');
  }

  const onAddVoteReward = () => {
    router.push('/addVote')
  }

  const claimableRewards = rewards.filter((reward) => {
    return BigNumber(reward.claimable).gt(0)
  })
  const potentialRewards = rewards.filter((reward) => {
    return BigNumber(reward.claimable).eq(0) && BigNumber(reward.rewardsUnlock).gt(moment().unix())
  }).sort((a, b) => {
    if ( BigNumber(a.tokensForBribe).gt(b.tokensForBribe) ){
      return -1;
    }
    if ( BigNumber(a.tokensForBribe).lt(b.tokensForBribe) ){
      return 1;
    }
    return 0;
  })

  const claimableVoteRewards = voteRewards.filter((reward) => {
    return reward.voterState === 1 && reward.vote.vote.open !== true
  })
  const potentialVoteRewards = voteRewards.filter((reward) => {
    return reward.vote.vote.open === true
  }).sort((a, b) => {
    if ( BigNumber(a.estimateBribe).gt(b.estimateBribe) ){
      return -1;
    }
    if ( BigNumber(a.estimateBribe).lt(b.estimateBribe) ){
      return 1;
    }
    return 0;
  })

  const renderLoadingSkelly = () => {
    return (<>
      <Typography className={ classes.cardsHeader }>Loading Rewards:</Typography>
      <div className={ classes.cardsContainer }>
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
        <Skeleton variant="rect" width={260} height={280} className={ classes.skelly } />
      </div>
    </>)
  }

  return (
    <Layout changeTheme={changeTheme}>
      <div className={ theme.palette.type === 'dark' ? classes.containerDark : classes.container }>
        <div className={ classes.leftContainer }>
          <div className={ classes.copyContainer }>
            <div className={ classes.copyCentered }>
              <Typography variant='h1' className={ classes.titleSpacing }><span className={ classes.helpingUnderline }>CRV Vote Incentives</span></Typography>
              <Typography variant='h2' className={ classes.helpingParagraph }>Get more for your votes! <ThumbUpIcon className={ classes.thumbIcon } /></Typography>
              <div className={ classes.divider }>
              </div>
              <Typography className={ classes.addRewardText }>Add a reward to a pool which will be distributed proportionally to everyone who votes for it.</Typography>
              {
                account &&
                  <div className={ classes.addButtons }>
                    <Button
                      size='large'
                      variant='contained'
                      className={ classes.addNetworkButton }
                      onClick={ onAddReward }
                    >
                      <Typography className={ classes.buttonLabel }>Add Gauge Bribe</Typography>
                    </Button>
                    <Button
                      size='large'
                      variant='contained'
                      className={ classes.addNetworkButton }
                      onClick={ onAddVoteReward }
                    >
                      <Typography className={ classes.buttonLabel }>Add Vote Bribe</Typography>
                    </Button>
                  </div>
              }
            </div>
            <div className={ classes.socials }>
              <a className={ `${classes.socialButton}` } href='https://github.com/antonnell/vote-incentives' target='_blank' rel="noopener noreferrer" >
                <svg version="1.1" width="24" height="24" viewBox="0 0 24 24">
                  <path fill={ '#FFF' } d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                <Typography variant='body1' className={ classes.sourceCode }>View Source Code</Typography>
              </a>
              <Typography variant='subtitle1' className={ classes.version }>Version 1.1.0</Typography>
            </div>
          </div>
        </div>
        <div className={ theme.palette.type === 'dark' ? classes.listContainerDark : classes.listContainer }>
          {
            !account &&
            <div className={ classes.connectContainer}>
              <Typography className={ classes.connectWalletText }>Connect your wallet to find your rewards.</Typography>
              <Unlock />
            </div>
          }
          {
            account &&
            <>
              <div className={ theme.palette.type === 'dark' ? classes.headerContainerDark : classes.headerContainer }>
                <div className={ classes.filterRow }>
                  <ThemeProvider theme={theme.palette.type === 'dark' ? searchThemeDark : searchTheme}>
                    <TextField
                      error={ searchError }
                      fullWidth
                      className={ classes.searchContainer }
                      variant="outlined"
                      placeholder="Reward Token Address (eg. 0x6b1754....1d0f)"
                      value={ search }
                      onChange={ onSearchChanged }
                      onKeyDown={ onSearch }
                      InputProps={{
                        endAdornment: <InputAdornment position="end">
                          <SearchIcon fontSize="medium"  />
                        </InputAdornment>,
                        startAdornment: <InputAdornment position="start">
                          <Typography className={ classes.searchInputAdnornment }>
                            Search Rewards:
                          </Typography>
                        </InputAdornment>
                      }}
                    />
                  </ThemeProvider>
                </div>
                <Header changeTheme={ changeTheme } />
              </div>
              {
                claimableRewards.length === 0 && claimableVoteRewards.length === 0 && potentialRewards.length === 0 && potentialVoteRewards.length === 0 && renderLoadingSkelly()
              }
              {
                (claimableRewards.length > 0 || claimableVoteRewards.length > 0) &&
                <>
                  <Typography className={ classes.cardsHeader }>Claimable Rewards:</Typography>
                  <div className={ classes.cardsContainer }>
                    {
                      claimableRewards.map((reward, idx) => {
                        return <RewardCard reward={ reward } key={ idx } />
                      })
                    }
                    {
                      claimableVoteRewards.map((reward, idx) => {
                        return <VoteRewardCard reward={ reward } key={ idx } />
                      })
                    }
                  </div>
                </>
              }
              {
                (potentialRewards.length > 0 || potentialVoteRewards.length > 0) &&
                <>
                  <Typography className={ classes.cardsHeader }>Upcoming Rewards:</Typography>
                  <div className={ classes.cardsContainer }>
                    {
                      potentialRewards.map((reward, idx) => {
                        return <RewardCard reward={ reward } key={ idx } />
                      })
                    }
                    {
                      potentialVoteRewards.map((reward, idx) => {
                        return <VoteRewardCard reward={ reward } key={ idx } />
                      })
                    }
                  </div>
                </>
              }
            </>
          }
        </div>
      </div>
    </Layout>
  );
}

export default withTheme(Voting);
