import async from 'async';
import {
  MAX_UINT256,
  WEEK,
  ERROR,
  TX_SUBMITTED,
  STORE_UPDATED,
  INCENTIVES_UPDATED,
  CONFIGURE_INCENTIVES,
  INCENTIVES_CONFIGURED,
  GET_INCENTIVES_BALANCES,
  INCENTIVES_BALANCES_RETURNED,
  BRIBERY_ADDRESS,
  GAUGE_CONTROLLER_ADDRESS,
  CLAIM_REWARD,
  REWARD_CLAIMED,
  SEARCH_TOKEN,
  SEARCH_TOKEN_RETURNED,
  ADD_REWARD,
  ADD_REWARD_RETURNED
} from './constants';
import { NextRouter } from 'next/router'


import { ERC20_ABI, BRIBERY_ABI, GAUGE_CONTROLLER_ABI, GAUGE_CONTRACT_ABI } from './abis';

import * as moment from 'moment';

import stores from './';
import { bnDec } from '../utils';
import BigNumber from 'bignumber.js';

const fetch = require('node-fetch');

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      configured: false,
      gauges: [],
      rewards: []
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case CONFIGURE_INCENTIVES:
            this.configure(payload);
            break;
          case GET_INCENTIVES_BALANCES:
            this.getBalances(payload);
            break;
          case CLAIM_REWARD:
            this.claimReward(payload);
            break;
          case SEARCH_TOKEN:
            this.searchToken(payload);
            break;
          case ADD_REWARD:
            this.addReward(payload);
            break;
          default: {
          }
        }
      }.bind(this),
    );
  }

  getStore = (index) => {
    return this.store[index];
  };

  setStore = (obj) => {
    this.store = { ...this.store, ...obj };
    console.log(this.store);
    return this.emitter.emit(STORE_UPDATED);
  };

  configure = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const gauges = await this._getGauges(web3);
    this.setStore({ gauges: gauges, configured: true })

    this.dispatcher.dispatch({ type: GET_INCENTIVES_BALANCES });
    this.emitter.emit(INCENTIVES_CONFIGURED);
  };

  _getGauges = async (web3) => {
    try {

    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGauges(${web3})`)
      console.log(ex)
      console.log("------------------------------------")
    }
    const gaugeController = new web3.eth.Contract(GAUGE_CONTROLLER_ABI, GAUGE_CONTROLLER_ADDRESS)
    const nGauges = await gaugeController.methods.n_gauges().call()

    const arr = [...Array(parseInt(nGauges)).keys()]

    const promises = arr.map(index => {
      return new Promise((resolve, reject) => {
        const gaugeInfo = this._getGaugeInfo(web3, gaugeController, index);
        resolve(gaugeInfo);
      });
    });

    const result = await Promise.all(promises);

    return result
  }

  _getGaugeInfo = async (web3, gaugeController, index) => {
    try {
      const gaugeAddress = await gaugeController.methods.gauges(index).call()
      const gaugeType = await gaugeController.methods.gauge_types(gaugeAddress).call()

      let name = 'Unknown'
      let lpTokenAddress = ''

      const gaugeWeight = await gaugeController.methods.gauge_relative_weight(gaugeAddress).call()

      if(gaugeType === '0') {
        const gauge = new web3.eth.Contract(GAUGE_CONTRACT_ABI, gaugeAddress)
        lpTokenAddress = await gauge.methods.lp_token().call()

        // if not 0, we cant get LP token info cause it is on a different chain
        const lpToken = new web3.eth.Contract(ERC20_ABI, lpTokenAddress)
        name = await lpToken.methods.name().call()
      } else {
        //manually map gauge names
        switch (gaugeAddress) {
          case '0xb9C05B8EE41FDCbd9956114B3aF15834FDEDCb54':
            name = 'Curve.fi DAI/USDC (DAI+USDC)'
            break;
          case '0xfE1A3dD8b169fB5BF0D5dbFe813d956F39fF6310':
            name = 'Curve.fi fUSDT/DAI/USDC'
            break;
          case '0xC48f4653dd6a9509De44c92beb0604BEA3AEe714':
            name = 'Curve.fi amDAI/amUSDC/amUSDT'
            break;
          case '0x6955a55416a06839309018A8B0cB72c4DDC11f15':
            name = 'Curve.fi USD-BTC-ETH'
            break;
          case '0x488E6ef919C2bB9de535C634a80afb0114DA8F62':
            name = 'Curve.fi amWBTC/renBTC'
            break;
          case '0xfDb129ea4b6f557b07BcDCedE54F665b7b6Bc281':
            name = 'Curve.fi WBTC/renBTC'
            break;
          case '0x060e386eCfBacf42Aa72171Af9EFe17b3993fC4F':
            name = 'Curve USD-BTC-ETH'
            break;
          case '0x6C09F6727113543Fd061a721da512B7eFCDD0267':
            name = 'Curve.fi wxDAI/USDC/USDT'
            break;
          case '0xDeFd8FdD20e0f34115C7018CCfb655796F6B2168':
            name = 'Curve.fi USD-BTC-ETH'
            break;
          default:
        }
      }

      return {
        gaugeAddress: gaugeAddress,
        lpTokenAddress: lpTokenAddress,
        name: name,
        gaugeWeight: gaugeWeight,
        gaugeType: gaugeType,
        gaugeTypeName: this._mapGaugeTypeToName(gaugeType),
        logo: '/unknown-logo.png'
      }
    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGaugeInfo(${web3}, ${gaugeController}, ${index})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
    }
  }

  _mapGaugeToLogo = (address) => {
    const base = 'https://curve.fi/static/icons/svg/crypto-icons-stack-2-ethereum.svg#'
    switch (address) {
      // case '0x7ca5b0a2910B33e9759DC7dDB0413949071D7575':
      //   return `${base}comp`
      // case '0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53':
      //   return `${base}usdt`
      // case '0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1':
      //   return `${base}yfi`
      // case '0x69Fb7c45726cfE2baDeE8317005d3F94bE838840':
      //   return `${base}comp`
      // case '0x64E3C23bfc40722d3B649844055F1D51c1ac041d':
      //   return `${base}comp`
      // case '0xB1F2cdeC61db658F091671F5f199635aEF202CAC':
      //   return `${base}comp`
      // case '0xA90996896660DEcC6E997655E065b23788857849':
      //   return `${base}comp`
      // case '0x705350c4BcD35c9441419DdD5d2f097d7a55410F':
      //   return `${base}comp`
      // case '0x4c18E409Dc8619bFb6a1cB56D114C3f592E0aE79':
      //   return `${base}comp`
      // case '0xbFcF63294aD7105dEa65aA58F8AE5BE2D9d0952A':
      //   return `${base}comp`
      // case '0x18478F737d40ed7DEFe5a9d6F1560d84E283B74e':
      //   return `${base}comp`
      // case '0xC5cfaDA84E902aD92DD40194f0883ad49639b023':
      //   return `${base}comp`
      // case '0x2db0E83599a91b508Ac268a6197b8B14F5e72840':
      //   return `${base}comp`
      // case '0xC2b1DF84112619D190193E48148000e3990Bf627':
      //   return `${base}comp`
      // case '0xF98450B5602fa59CC66e1379DFfB6FDDc724CfC4':
      //   return `${base}comp`
      // case '0x5f626c30EC1215f4EdCc9982265E8b1F411D1352':
      //   return `${base}comp`
      // case '0x6828bcF74279eE32f2723eC536c22c51Eed383C6':
      //   return `${base}comp`
      // case '0x4dC4A289a8E33600D8bD4cf5F6313E43a37adec7':
      //   return `${base}comp`
      // case '0xAEA6c312f4b3E04D752946d329693F7293bC2e6D':
      //   return `${base}comp`
      // case '0xdFc7AdFa664b08767b735dE28f9E84cd30492aeE':
      //   return `${base}comp`
      default:
        return `/unknown-logo.png`
    }
  }

  _mapGaugeTypeToName = (gaugeType) => {
    switch (gaugeType) {
      case '0':
        return 'Ethereum'
      case '1':
        return 'Fantom'
      case '2':
        return 'Polygon'
      case '3':
        return 'Ethereum'
      case '4':
        return 'xDAI'
      case '5':
        return 'Ethereum'
      default:
        return 'Unknown'
    }
  }

  getBalances = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return null;
    }

    const account = await stores.accountStore.getStore('account');
    if (!account) {
      return null;
    }

    const gauges = this.getStore('gauges')
    if(!gauges || gauges.length === 0) {
      return null
    }

    let myParam = null

    if(payload.content && payload.content.address) {
      myParam = payload.content.address
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      myParam = urlParams.get('reward');
      if(!myParam || !web3.utils.isAddress(myParam)) {
        return null
      }
    }

    const rewardTokenAddress = myParam
    const bribery = await this._getBribery(web3, account, gauges, rewardTokenAddress)
    const rewardToken = await this._getTokenInfo(web3, rewardTokenAddress)

    let rewards = []

    for(let i = 0; i < gauges.length; i++) {

      if((bribery[i].canClaim && BigNumber(bribery[i].claimable).gt(0)) || (bribery[i].canClaim && bribery[i].hasClaimed)) {
        rewards.push({
          amount: bribery[i].claimable,
          canClaim: bribery[i].canClaim,
          hasClaimed: bribery[i].hasClaimed,
          gauge: gauges[i],
          rewardToken: rewardToken
        })
      }
    }

    this.setStore({ rewards: rewards })

    this.emitter.emit(INCENTIVES_BALANCES_RETURNED, []);
  };

  _getTokenInfo = async (web3, tokenAddress, getBalance) => {
    try {
      const token = new web3.eth.Contract(ERC20_ABI, tokenAddress)

      const symbol = await token.methods.symbol().call()
      const decimals = parseInt(await token.methods.decimals().call())
      let balance = 0

      if(getBalance) {
        const account = await stores.accountStore.getStore('account');
        balance = await token.methods.balanceOf(account.address).call()
      }

      return {
        address: tokenAddress,
        symbol,
        decimals,
        balance
      }

    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getTokenInfo(${web3}, ${tokenAddress})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
    }
  }

  _getBribery = async (web3, account, gauges, rewardTokenAddress) => {
    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS)
    const block = await web3.eth.getBlockNumber();

    const briberyResultsPromises = gauges.map(async (gauge) => {
      const activePeriod = await bribery.methods.active_period(gauge.gaugeAddress, rewardTokenAddress).call()
      if(BigNumber(activePeriod).eq(0)) {
        return {
          claimable: "0",
          lastUserClaim: "0",
          activePeriod: "0",
          canClaim: false,
          hasClaimed: false
        }
      }

      const claimable = await bribery.methods.claimable(account.address, gauge.gaugeAddress, rewardTokenAddress).call()
      const lastUserClaim = await bribery.methods.last_user_claim(account.address, gauge.gaugeAddress, rewardTokenAddress).call()

      return {
        claimable,
        lastUserClaim,
        activePeriod,
        canClaim: BigNumber(block).lt(BigNumber(activePeriod).plus(WEEK)),
        hasClaimed: BigNumber(lastUserClaim).eq(activePeriod)
      }
    })

    const briberyResults = await Promise.all(briberyResultsPromises);
    return briberyResults
  }

  claimReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { reward } = payload.content;

    this._callClaimReward(web3, account, reward.gauge.gaugeAddress, reward.rewardToken.address, (err, res) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(REWARD_CLAIMED, res);
    });
  }

  _callClaimReward = async (web3, account, gauge, rewardToken, callback) => {
    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'claim_reward', [gauge, rewardToken], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  searchToken = async (payload) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { address } = payload.content;

    try {
      const token = await this._getTokenInfo(web3, address, true)
      return this.emitter.emit(SEARCH_TOKEN_RETURNED, token);
    } catch(ex) {
      console.log(ex)
      return this.emitter.emit(ERROR, ex)
    }
  }

  addReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { rewardToken, rewardAmount, gauge } = payload.content;

    let sendAmount = BigNumber(rewardAmount).times(10**rewardToken.decimals).toFixed(0)

    this._checkAllowance(web3, rewardToken.address, account.address, BRIBERY_ADDRESS, sendAmount, (err) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }
      this._callAddReward(web3, account, gauge.gaugeAddress, rewardToken.address, sendAmount, (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(REWARD_CLAIMED, res);
      });
    })

  }

  _checkAllowance = async (web3, token, owner, spender, spendingAmount, callback) => {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, token)
    const allowance = await tokenContract.methods.allowance(owner, spender).call();

    if(BigNumber(spendingAmount).lte(allowance)) {
      callback()
    } else {
      const gasPrice = await stores.accountStore.getGasPrice();
      this._callContractWait(web3, tokenContract, 'approve', [spender, MAX_UINT256], { address: owner }, gasPrice, null, null, callback)
    }
  }

  _callAddReward = async (web3, account, gauge, rewardToken, rewardAmount, callback) => {
    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'add_reward_amount', [gauge, rewardToken, rewardAmount], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  _callContract = (web3, contract, method, params, account, gasPrice, dispatchEvent, dispatchEventPayload, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        context.emitter.emit(TX_SUBMITTED, hash);
        callback(null, hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        if (dispatchEvent && confirmationNumber == 0) {
          context.dispatcher.dispatch({ type: dispatchEvent, content: dispatchEventPayload });
        }
      })
      .on('error', function (error) {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };

  _callContractWait = (web3, contract, method, params, account, gasPrice, dispatchEvent, dispatchEventPayload, callback) => {
    const context = this;
    contract.methods[method](...params)
      .send({
        from: account.address,
        gasPrice: web3.utils.toWei(gasPrice, 'gwei'),
      })
      .on('transactionHash', function (hash) {
        console.log(hash)
        // context.emitter.emit(TX_SUBMITTED, hash);
      })
      .on('receipt', function (receipt) {
        context.emitter.emit(TX_SUBMITTED, receipt.transactionHash);
        callback(null, receipt.transactionHash);

        if (dispatchEvent) {
          context.dispatcher.dispatch({ type: dispatchEvent, content: dispatchEventPayload });
        }
      })
      .on('error', function (error) {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      })
      .catch((error) => {
        if (!error.toString().includes('-32601')) {
          if (error.message) {
            return callback(error.message);
          }
          callback(error);
        }
      });
  };
}

export default Store;
