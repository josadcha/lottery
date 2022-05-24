const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000' });
});

describe('Lottery contract', () => {
  it('is successfully deployed', () => {
    assert.ok(lottery.options.address);
  });

  it('is able to be participated by 2 player', async () => {
    await lottery.methods.enter().send({
      value: web3.utils.toWei('0.05', 'ether'),
      from: accounts[1],
      gas: '1000000',
    });

    await lottery.methods.enter().send({
      value: web3.utils.toWei('0.02', 'ether'),
      from: accounts[2],
      gas: '1000000',
    });

    const players = await lottery.methods.getPlayers().call();

    assert.equal(players.length, 2);
    assert.equal(players[0], accounts[1]);
    assert.equal(players[1], accounts[2]);
  });

  it('fails if not enough ether', async () => {
    try {
      await lottery.methods.enter().send({
        value: web3.utils.toWei('0.005', 'ether'),
        from: accounts[1],
        gas: '1000000',
      });
      assert(false);
    } catch (error) {
      assert(error);
    }

    const players = await lottery.methods.getPlayers().call();

    assert.equal(players.length, 0);
  });

  it('checks for admin', async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
        gas: '1000000',
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it('works', async () => {
    const balance = await web3.eth.getBalance(accounts[1]);
    console.log(balance);
    await lottery.methods.enter().send({
      value: web3.utils.toWei('2', 'ether'),
      from: accounts[1],
      gas: '1000000',
    });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
      gas: '1000000',
    });
    const players = await lottery.methods.getPlayers().call();

    const finalBalance = await web3.eth.getBalance(accounts[1]);
    assert.equal(players.length, 0);
    assert.ok(finalBalance - balance < web3.utils.toWei('1.8', 'ether'));
  });
});
