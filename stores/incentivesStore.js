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
  BRIBERY_ADDRESS_V2,
  BRIBERY_TOKENS_ADDRESS_V2,
  GAUGE_CONTROLLER_ADDRESS,
  VOTE_BRIBERY_ADDRESS,
  VOTE_SOURCE_ADDRESS,
  CLAIM_REWARD,
  REWARD_CLAIMED,
  SEARCH_TOKEN,
  SEARCH_TOKEN_RETURNED,
  ADD_REWARD,
  ADD_REWARD_RETURNED,
  ADD_VOTE_REWARD,
  ADD_VOTE_REWARD_RETURNED
} from './constants';
import { NextRouter } from 'next/router'


import { ERC20_ABI, BRIBERY_ABI, GAUGE_CONTROLLER_ABI, GAUGE_CONTRACT_ABI, VOTE_SOURCE_ABI, VOTE_BRIBERY_ABI } from './abis';


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
      votes: [],
      rewards: [],
      voteRewards: []
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
          case ADD_VOTE_REWARD:
            this.addVoteReward(payload);
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

    const votes = await this._getVotes(web3);
    this.setStore({ votes: votes })

    this.dispatcher.dispatch({ type: GET_INCENTIVES_BALANCES });
    this.emitter.emit(INCENTIVES_CONFIGURED);
  };

  _getVotes = async (web3) => {
    try {
      const votesSourceContract = new web3.eth.Contract(VOTE_SOURCE_ABI, VOTE_SOURCE_ADDRESS)
      const votesBriberyContract = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS)
      const nVotes = await votesSourceContract.methods.votesLength().call()

      const arr = [...Array(parseInt(nVotes)).keys()]

      const promises = arr.map(index => {
        return new Promise((resolve, reject) => {
          const voteInfo = this._getVoteInfo(web3, votesSourceContract, votesBriberyContract, index);
          resolve(voteInfo);
        });
      });

      const result = await Promise.all(promises);

      return result
    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getVotes(${web3})`)
      console.log(ex)
      console.log("------------------------------------")
    }
  }

  _getVoteInfo = async (web3, votesSourceContract, votesBriberyContract, index) => {
    try {
      const [vote, rewardsPerVote] = await Promise.all([
        votesSourceContract.methods.getVote(index).call(),
        votesBriberyContract.methods.rewards_per_vote(index).call()
      ]);
      return {
        index,
        vote,
        rewardsPerVote,
      }
    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in 4(${web3}, ${votesSourceContract}, ${votesBriberyContract}, ${index})`)
      console.log(ex)
      console.log("------------------------------------")
      return ex
    }
  }

  _getGauges = async (web3) => {
    try {
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
    } catch(ex) {
      console.log("------------------------------------")
      console.log(`exception thrown in _getGauges(${web3})`)
      console.log(ex)
      console.log("------------------------------------")
    }
  }

  _getGaugeInfo = async (web3, gaugeController, index) => {
    try {
      const gaugeAddress = await gaugeController.methods.gauges(index).call()

      const [gaugeType, gaugeWeight] = await Promise.all([
        gaugeController.methods.gauge_types(gaugeAddress).call(),
        gaugeController.methods.gauge_relative_weight(gaugeAddress).call()
      ]);

      let name = 'Unknown'
      let lpTokenAddress = ''

      if(['0', '5', '6'].includes(gaugeType)) {
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
          case '0xd8b712d29381748dB89c36BCa0138d7c75866ddF':
            name = 'Curve.fi Factory USD Metapool: Magic Internet Money 3Pool'
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

  _mapGaugeTypeToName = (gaugeType) => {
    switch (gaugeType) {
      case '0':
      case '3':
      case '5':
      case '6':
        return 'Ethereum'
      case '1':
        return 'Fantom'
      case '2':
        return 'Polygon'
      case '4':
        return 'xDAI'
      default:
        return 'Unknown'
    }
  }

  _getDefaultTokens = () => {
    return [
      {
        address: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
        symbol: 'FTM',
        decimals: 18
      },
      {
        address: '0x2ba592f78db6436527729929aaf6c908497cb200',
        symbol: 'CREAM',
        decimals: 18
      },
      {
        address: '0x090185f2135308bad17527004364ebcc2d37e5f6',
        symbol: 'SPELL',
        decimals: 18
      },
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        symbol: 'DAI',
        decimals: 18
      },
      {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6
      },
      {
        address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
        symbol: 'LDO',
        decimals: 18
      },
      {
        address: '0xdbdb4d16eda451d0503b854cf79d55697f90c8df',
        symbol: 'ALCX',
        decimals: 18
      },
      {
        address: '0x9D79d5B61De59D882ce90125b18F74af650acB93',
        symbol: 'NSBT',
        decimals: 6
      }
    ]
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

    let gauges = this.getStore('gauges')
    if(!gauges || gauges.length === 0) {
      return null
    }

    gauges = await this._getCurrentGaugeVotes(web3, account, gauges)

    let myParam = null

    if(payload.content && payload.content.address) {
      myParam = payload.content.address
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      myParam = urlParams.get('reward');
    }

    const rewardTokenAddress = myParam

    // FTM, CREAM, MIM, DAI, USDC,
    const defaultTokens = this._getDefaultTokens()

    //If it is a valid token, we add it to the search list
    if(rewardTokenAddress && web3.utils.isAddress(rewardTokenAddress)) {
      let includesToken = false
      for(let i = 0; i < defaultTokens.length; i++) {
        if(defaultTokens[i].address.toLowerCase() === rewardTokenAddress.toLowerCase()) {
          includesToken = true
          break;
        }
      }

      if(!includesToken) {
        const rewardToken = await this._getTokenInfo(web3, rewardTokenAddress)
        defaultTokens.push(rewardToken)
      }
    }

    async.map(defaultTokens, async (token, callback) => {
      const bribery = await this._getBribery(web3, account, gauges, defaultTokens, token.address)
      if(callback) {
        callback(null, bribery)
      } else {
        return bribery
      }
    }, (err, briberies) => {
      if(err) {
        this.emitter.emit(ERROR, err)
      }

      let flatBriberies = briberies.flat()
      let rewards = []
      for(let j = 0; j < flatBriberies.length; j++) {
        let bribery = flatBriberies[j]
        for(let i = 0; i < bribery.length; i++) {
          let bribe = bribery[i]
          rewards.push({
            activePeriod: bribe.activePeriod,
            rewardsUnlock: BigNumber(bribe.activePeriod).plus(WEEK).toFixed(0),
            claimable: BigNumber(bribe.claimable).div(10**bribe.rewardToken.decimals).toFixed(bribe.rewardToken.decimals),
            canClaim: bribe.canClaim,
            hasClaimed: bribe.hasClaimed,
            gauge: bribe.gauge,
            tokensForBribe: BigNumber(bribe.tokensForBribe).div(10**bribe.rewardToken.decimals).toFixed(bribe.rewardToken.decimals),
            rewardPerToken: bribe.rewardPerToken,
            rewardToken: bribe.rewardToken
          })
        }
      }

      this.setStore({ rewards: rewards })
      this.emitter.emit(INCENTIVES_BALANCES_RETURNED, []);
    })

    let votes = this.getStore('votes')
    if(!votes || votes.length === 0) {
      return null
    }

    const voteRewards = await this._getVoteBribery(web3, account, votes)
    this.setStore({ voteRewards: voteRewards })
    this.emitter.emit(INCENTIVES_BALANCES_RETURNED, []);
  };

  _getTokenInfo = async (web3, tokenAddress, getBalance) => {
    try {
      const token = new web3.eth.Contract(ERC20_ABI, tokenAddress)

      const [symbol, decimals] = await Promise.all([
        token.methods.symbol().call(),
        token.methods.decimals().call()
      ]);

      let balance = 0
      if(getBalance) {
        const account = await stores.accountStore.getStore('account');
        balance = await token.methods.balanceOf(account.address).call()
      }

      return {
        address: tokenAddress,
        symbol,
        decimals: parseInt(decimals),
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

  _getVoteBribery = async (web3, account, votes) => {
    const voteBriberyContract = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS)
    const votesSourceContract = new web3.eth.Contract(VOTE_SOURCE_ABI, VOTE_SOURCE_ADDRESS)

    const res = await Promise.all(votes.map(async (vote) => {

      if(!vote.rewardsPerVote || vote.rewardsPerVote.length === 0) {
        return null
      }

      const rewards = await Promise.all(vote.rewardsPerVote.map(async (rewardTokenAddress) => {
          const [estimateBribe, rewardAmount, voterState, hsaClaimed] = await Promise.all([
            voteBriberyContract.methods.estimate_bribe(vote.index, rewardTokenAddress, account.address).call(),
            voteBriberyContract.methods.reward_amount(vote.index, rewardTokenAddress).call(),
            votesSourceContract.methods.getVoterState(vote.index, account.address).call(),
            voteBriberyContract.methods.has_claimed(vote.index, rewardTokenAddress, account.address).call()
          ]);

          const rewardToken = await this._getTokenInfo(web3, rewardTokenAddress)

          return {
            estimateBribe: BigNumber(estimateBribe).div(10**rewardToken.decimals).toFixed(rewardToken.decimals),
            rewardAmount: BigNumber(rewardAmount).div(10**rewardToken.decimals).toFixed(rewardToken.decimals),
            voterState,
            hsaClaimed,
            vote,
            rewardToken
          }
        })
      )

      return rewards
    }))

    return res.filter((reward) => {
      return reward != null
    }).flat()
  }

  _getBribery = async (web3, account, gauges, rewardTokens, rewardTokenAddress) => {
    const block = await web3.eth.getBlockNumber();

    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS)
    const briberyV2 = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS_V2)
    const briberyTokensContract = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_TOKENS_ADDRESS_V2)

    // For V2 call gauges_per_reward.
    // foreach of those, we get the user's reward only. no looping through dead gauges anymore.
    const [gaugesPerRewardV2] = await Promise.all([
      briberyV2.methods.gauges_per_reward(rewardTokenAddress).call()
    ]);

    let briberyResultsPromisesV2 = []
    if(gaugesPerRewardV2.length > 0) {
      briberyResultsPromisesV2 = gaugesPerRewardV2.map(async (gauge) => {

        const [activePeriod, claimable, lastUserClaim, tokensForBribe, rewardPerToken] = await Promise.all([
          briberyV2.methods.active_period(gauge, rewardTokenAddress).call(),
          briberyV2.methods.claimable(account.address, gauge, rewardTokenAddress).call(),
          briberyV2.methods.last_user_claim(account.address, gauge, rewardTokenAddress).call(),
          briberyTokensContract.methods.tokens_for_bribe(account.address, gauge, rewardTokenAddress).call(),
          briberyV2.methods.reward_per_token(gauge, rewardTokenAddress).call(),
        ]);

        return {
          version: 2,
          claimable,
          lastUserClaim,
          activePeriod,
          tokensForBribe,
          rewardPerToken,
          canClaim: BigNumber(block).lt(BigNumber(activePeriod).plus(WEEK)),
          4: BigNumber(lastUserClaim).eq(activePeriod),
          gauge: gauges.filter((g) => { return g.gaugeAddress.toLowerCase() === gauge.toLowerCase() })[0],
          rewardToken: rewardTokens.filter((r) => { return r.address.toLowerCase() === rewardTokenAddress.toLowerCase() })[0]
        }
      })
    }

    const briberyResultsV2 = await Promise.all(briberyResultsPromisesV2);
    return [briberyResultsV2]
  }

  _getCurrentGaugeVotes = async (web3, account, gauges) => {
    const gaugeController = new web3.eth.Contract(GAUGE_CONTROLLER_ABI, GAUGE_CONTROLLER_ADDRESS)

    const userVoteSlopes = await Promise.all(gauges.map((gauge) => {
      return gaugeController.methods.vote_user_slopes(account.address, gauge.gaugeAddress).call()
    }));

    for(let i = 0; i < gauges.length; i++) {
      gauges[i].votes = userVoteSlopes[i]
      gauges[i].votes.userVoteSlopeAmount = BigNumber(userVoteSlopes[i].slope).div(10**10).toFixed(10)
      gauges[i].votes.userVoteSlopePercent = BigNumber(userVoteSlopes[i].power).div(100).toFixed(2)
    }

    return gauges
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

    this._callClaimReward(web3, account, reward.gauge.gaugeAddress, reward.rewardToken.address, reward.version,  (err, res) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }

      return this.emitter.emit(REWARD_CLAIMED, res);
    });
  }

  _callClaimReward = async (web3, account, gauge, rewardToken, version, callback) => {
    let address = BRIBERY_ADDRESS_V2
    if(version === 1) {
      address = BRIBERY_ADDRESS
    }
    const bribery = new web3.eth.Contract(BRIBERY_ABI, address);
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

    this._checkAllowance(web3, rewardToken.address, account.address, BRIBERY_ADDRESS_V2, sendAmount, (err) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }
      this._callAddReward(web3, account, gauge.gaugeAddress, rewardToken.address, sendAmount, (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(ADD_REWARD_RETURNED, res);
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
    const bribery = new web3.eth.Contract(BRIBERY_ABI, BRIBERY_ADDRESS_V2);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'add_reward_amount', [gauge, rewardToken, rewardAmount], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
  };

  addVoteReward = async (payload) => {
    const account = stores.accountStore.getStore('account');
    if (!account) {
      return false;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      return false;
    }

    const { rewardToken, rewardAmount, vote } = payload.content;

    let sendAmount = BigNumber(rewardAmount).times(10**rewardToken.decimals).toFixed(0)

    this._checkAllowance(web3, rewardToken.address, account.address, VOTE_BRIBERY_ADDRESS, sendAmount, (err) => {
      if (err) {
        return this.emitter.emit(ERROR, err);
      }
      this._callAddVoteReward(web3, account, vote.index, rewardToken.address, sendAmount, (err, res) => {
        if (err) {
          return this.emitter.emit(ERROR, err);
        }

        return this.emitter.emit(ADD_VOTE_REWARD_RETURNED, res);
      });
    })
  }

  _callAddVoteReward = async (web3, account, voteIndex, rewardToken, rewardAmount, callback) => {
    const bribery = new web3.eth.Contract(VOTE_BRIBERY_ABI, VOTE_BRIBERY_ADDRESS);
    const gasPrice = await stores.accountStore.getGasPrice();

    this._callContractWait(web3, bribery, 'add_reward_amount', [voteIndex, rewardToken, rewardAmount], account, gasPrice, GET_INCENTIVES_BALANCES, {}, callback);
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
