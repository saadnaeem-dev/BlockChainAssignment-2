const ec = new EC("secp256k1");
const EC = require("elliptic").ec;
const crypto = require("crypto");
class SingleBlock {
    /**
     * @param {number} CurrentTimestamp
     * @param {IndividualTransaction[]} BlockTransactions
     * @param {string} PreviousBlockHash
     */
    constructor(CurrentTimestamp, BlockTransactions, PreviousBlockHash = "") {
      this.PreviousBlockHash = PreviousBlockHash;
      this.CurrentTimestamp = CurrentTimestamp;
      this.BlockTransactions = BlockTransactions;
      this.nonce = 0;
      this.hash = this.calculateSHA256();
    }
  
    /**
     * Returns the SHA256 of this block (by processing all the data stored
     * inside this block)
     *
     * @returns {string}
     */
    calculateSHA256() {
      return crypto
        .createHash("sha256")
        .update(
          this.PreviousBlockHash +
            this.CurrentTimestamp +
            JSON.stringify(this.BlockTransactions) +
            this.nonce
        )
        .digest("hex");
    }

/**
   * Calculate SHA256 of Signature and Data
   *
   * @returns {boolean}
   */
  hasValidBlockTransactions() {
    for (const tx of this.BlockTransactions) {
      if (!tx.isValidHash()) {
        return false;
      }
    }

    return true;
  }
}    

/**
   * Nonce Mining
   * @param {number} NonceDifficulty
   */
  mineBlock(NonceDifficulty) {
    while (
      this.hash.substring(0, NonceDifficulty) !== Array(NonceDifficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateSHA256();
    }

    debug(`Block mined: ${this.hash}`);
  }

  

class Blockchain {
  constructor() {
    this.chain = [this.FirstBlock()];
    this.NonceDifficulty = 2;
    this.pendingBlockTransactions = [];
    this.miningReward = 100;
  }

  /**
   * @returns {SingleBlock}
   */
  FirstBlock() {
    return new SingleBlock(Date.parse("2021-04-10"), [], "0");
  }

  /**
   * Return the last block using negative indexing
   * @returns {SingleBlock[]}
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }    

class IndividualTransaction {
  /**
   * @param {string} SenderAddress
   * @param {string} toAddress
   * @param {number} amount
   */
  constructor(SenderAddress, toAddress, amount) {
    this.SenderAddress = SenderAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.CurrentTimestamp = Date.now();
  }

  /**
   * Creates a SHA256 hash of the transaction
   *
   * @returns {string}
   */
  calculateSHA256() {
    return crypto
      .createHash("sha256")
      .update(this.SenderAddress + this.toAddress + this.amount + this.CurrentTimestamp)
      .digest("hex");
  }

  /**
   * Signing the IndividualTransaction
   * @param {string} signingKey
   */
  signTransaction(signingKey) {
    
    if (signingKey.getPublic("hex") !== this.SenderAddress) {
      throw new Error("You cannot sign BlockTransactions for other wallets!");
    }

    //Sign and store
    const hashTx = this.calculateSHA256();
    const sig = signingKey.sign(hashTx, "base64");

    this.signature = sig.toDER("hex");
  }

  /**
   * Checking if the signature is Valid
   * @returns {boolean}
   */
  isValidHash() {
    
    if (this.SenderAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.SenderAddress, "hex");
    return publicKey.verifySHA256(this.calculateSHA256(), this.signature);
  }
}


/**
   * Adding TX to the list of unspent TX's
   *
   * @param {IndividualTransaction} transaction
   */
  addTransaction(transaction) {
    if (!transaction.SenderAddress || !transaction.toAddress) {
      throw new Error("Transaction must include from and to address");
    }

    // verify the transactiion
    if (!transaction.isValidHash()) {
      throw new Error("Cannot add invalid transaction to chain");
    }

    if (transaction.amount <= 0) {
      throw new Error("Transaction amount should be higher than 0");
    }

    // Making sure that the amount sent is not greater than existing balance
    if (
      this.getBalanceOfAddress(transaction.SenderAddress) < transaction.amount
    ) {
      throw new Error("Not enough balance");
    }

    this.pendingBlockTransactions.push(transaction);
    debug("transaction added: %s", transaction);
  }


  /**
  * Unspent Transactions
   * @param {string} miningRewardAddress
   */
  minePendingBlockTransactions(miningRewardAddress) {
    const rewardTx = new IndividualTransaction(
      null,
      miningRewardAddress,
      this.miningReward
    );
    this.pendingBlockTransactions.push(rewardTx);

    const block = new SingleBlock(
      Date.now(),
      this.pendingBlockTransactions,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.NonceDifficulty);

    debug("Block successfully mined!");
    this.chain.push(block);

    this.pendingBlockTransactions = [];
  }

  

  /**
   * Returns the balance of a given wallet address.
   *
   * @param {string} address
   * @returns {number} The balance of the wallet
   */
  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.BlockTransactions) {
        if (trans.SenderAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    debug("getBalanceOfAdrees: %s", balance);
    return balance;
  }

  /**
   * Get all the BlockTransactions
   * @param  {string} address
   * @return {IndividualTransaction[]}
   */
  getAllBlockTransactionsForWallet(address) {
    const txs = [];

    for (const block of this.chain) {
      for (const tx of block.BlockTransactions) {
        if (tx.SenderAddress === address || tx.toAddress === address) {
          txs.push(tx);
        }
      }
    }

    debug("get BlockTransactions for wallet count: %s", txs.length);
    return txs;
  }

  /**
   * Checking Proper links between the blocks
   *
   * @returns {boolean}
   */
  isChainValid() {
    // Checking First Block
    const realGenesis = JSON.stringify(this.FirstBlock());

    if (realGenesis !== JSON.stringify(this.chain[0])) {
      return false;
    }

    
    // Checkin the complete chain
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];

      if (!currentBlock.hasValidBlockTransactions()) {
        return false;
      }

      if (currentBlock.hash !== currentBlock.calculateSHA256()) {
        return false;
      }
    }

    return true;
  }
}

module.exports.Blockchain = Blockchain;
module.exports.SingleBlock = SingleBlock;
module.exports.IndividualTransaction = IndividualTransaction;
