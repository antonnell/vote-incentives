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
      }

      return {
        gaugeAddress: gaugeAddress,
        lpTokenAddress: lpTokenAddress,
        name: name,
        gaugeWeight: gaugeWeight,
        gaugeType: gaugeType,
        gaugeTypeName: this._mapGaugeTypeToName(gaugeType)
      }
    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGaugeInfo(${web3}, ${gaugeController}, ${index})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
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
        return 'Crypto Pools'
      case '4':
        return 'xDAI'
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

    this._checkAllowance(web3, rewardToken.address, account.address, BRIBERY_ADDRESS, sendAmount, () => {
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
