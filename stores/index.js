import AccountStore from './accountStore';
import IncentivesStore from './incentivesStore';

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

const accountStore = new AccountStore(dispatcher, emitter);
const incentivesStore = new IncentivesStore(dispatcher, emitter);

export default {
  accountStore: accountStore,
  incentivesStore: incentivesStore,
  dispatcher: dispatcher,
  emitter: emitter,
};
