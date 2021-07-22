import React, { useState } from 'react';
import { Typography, Paper, Grid, Button, FormControlLabel, Checkbox } from '@material-ui/core'
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import RedeemIcon from '@material-ui/icons/Redeem';
import BigNumber from 'bignumber.js';

import classes from './rewardCard.module.css'

import stores from '../../stores/index.js'
import { getProvider, formatCurrency } from '../../utils'

import { CLAIM_REWARD } from '../../stores/constants';

const theme = createTheme({
  palette: {
    type: 'dark',
    secondary: {
      main: '#fff'
    }
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
    MuiButton: {
      root: {
        borderRadius: '32px',
        padding: '9px 16px'
      },
      containedPrimary: {
        backgroundColor: '#fff',
        color: '#000'
      }
    },
    MuiFormControlLabel: {
      root: {
        color: '#fff'
      }
    }
  },
});


export default function RewardCard({ reward }) {

  const [ checked, setChecked ] = useState(false)

  const onClaim = () => {
    stores.dispatcher.dispatch({ type: CLAIM_REWARD, content: { reward }})
  }

  return (
    <Paper elevation={ 1 } className={ classes.chainContainer } key={ reward.id } >
      <ThemeProvider theme={theme}>
        <div className={ classes.topInfo }>
          <RedeemIcon className={ classes.avatar } />
          <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(BigNumber(reward.claimable).div(reward.rewardToken.decimals).toFixed(reward.rewardToken.decimals)) } { reward.rewardToken.symbol }</Typography>
          <Typography className={ classes.descriptionSubText } align='center'>Your reward for voting for reward.name on Curve.fi</Typography>
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            onClick={ onClaim }
            color='primary'
          >
            <Typography className={ classes.buttonLabel }>Claim Reward</Typography>
          </Button>
        </div>
      </ThemeProvider>
    </Paper>
  )
}
