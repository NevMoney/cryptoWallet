// MY SERVER
Moralis.initialize('y7bQ8aZvO2XR51Scwuafav2tJ13V0qDQpqw90TXd')
Moralis.serverURL = 'https://zrsca4lyqk9t.moralishost.com:2053/server'

Moralis.Web3.getSigningData = () => 'Welcome to Tsaishen Crypto Wallet.'

let domain = 'http://127.0.0.1:5500/'
let homepage = `${domain}index.html`
let dashboard = `${domain}dashboard.html`
let toks = []

// REDIRECT USER BASED ON STATUS
const currentUser = Moralis.User.current()
console.log('user', currentUser)
if (currentUser) {
  $('#btn-toDashboard').show()
  $('#loginDisplay').hide()
  $('#greetLoggedInUser').append(
    `<h1>Welcome ${currentUser.get('username')}</h1>`,
  )
  document.getElementById('swap_button').disabled = false
}

//HELPER FUNCTIONS
const login = async () => {
  let user = Moralis.User.current()
  console.log('clicked')
  if (!user) {
    user = await Moralis.Web3.authenticate()
    let username = document.getElementById('user-username').value
    let email = document.getElementById('user-email').value
    console.log(username, email)
    if (username != '') {
      user.set('username', username)
    }
    if (email != '') {
      user.set('email', email)
    }
    user.set('ethAddress', user.get('ethAddress'))
    await user.save()
    window.location.href = dashboard
  } else {
    window.location.href = dashboard
  }
  console.log('logged in user:', user)
}

function goToDashboard() {
  window.location.href = dashboard
}

const logout = async () => {
  await Moralis.User.logOut()
  window.location.href = 'index.html'
}

const millisecondsToTime = (ms) => {
  let minutes = Math.floor(ms / (1000 * 60))
  let hours = Math.floor(ms / (1000 * 60 * 60))
  let days = Math.floor(ms / (1000 * 60 * 60 * 24))

  if (days < 1) {
    if (hours < 1) {
      if (minutes < 1) {
        return `less than a minute ago`
      } else return `${minutes} minutes(s) ago`
    } else return `${hours} hours(s) ago`
  } else return `${days} days(s) ago`
}

const fixURL = (url) => {
  if (url.startsWith('ipfs')) {
    return 'https://ipfs.moralis.io:2053/ipfs/' + url.split('ipfs://').slice(-1)
  } else {
    return url + '?format=json'
  }
}

const clearContent = (id) => {
  let _id = `#${id}`
  document.querySelector(_id).innerHTML = ''
}

// show/hide contents
const renderContent = (element) => {
  let elements = [
    '#transferETH',
    '#transferERC20',
    '#transferNFTs',
    '#transactionsSection',
    '#balancesSection',
    '#nftSection',
    '#starter',
    '#ERC20MetadataContent',
    '#buyCrypto',
    '#swapTokens',
    '#portfolioTracker',
    '#tradingAlerts',
  ]
  elements.forEach((e) => {
    hideContent(e)
  })
  showContent(element)
}

const hideContent = (el) => {
  let element = el
  document.querySelector(element).style.display = 'none'
}

const showContent = (el) => {
  let element = el
  document.querySelector(element).style.display = 'block'
}

//WEB3API FUNCTIONS
const getTransactions = async () => {
  console.log('get transaction button hit')
  let chain = $('#transactions-chain').val()
  console.log('chain', chain)
  if (chain == 'none') {
    alert('Please select a chain')
    return
  }

  const options = { chain: chain }
  const transactions = await Moralis.Web3API.account.getTransactions(options)
  console.log(transactions)

  // dynamically look up the chain and redirect the url to the correct page
  let url = ''
  if (chain == 'eth') {
    url = 'https://etherscan.io/tx/'
  } else if (chain == 'rinkeby') {
    url = 'https://rinkeby.etherscan.io/tx/'
  } else if (chain == 'bsc') {
    url = 'https://bscscan.com/tx/'
  } else if (chain == 'matic') {
    url = 'https://polygonscan.com/tx/'
  } else if (chain == 'avalanche') {
    url = 'https://explorer.avax.network/tx/'
  }

  $('#transactions-amount').empty()
  $('#transactions-amount').show()

  if (transactions.total === 0) {
    $('#table-of-fransactions').empty()
    $('#transactions-amount').append(
      `<p>No transactions found for your account on ${chain} chain.</p>`,
    )
  } else {
    $('#transactions-amount').append(
      `<p>Total transactions: ${transactions.total}</p>`,
    )
  }

  if (transactions.total > 0) {
    $('#table-of-fransactions').empty()
    $('#table-of-fransactions').show()
    let table = `
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Transaction</th>
              <th scope="col">Block Number</th>
              <th scope="col">Age</th>
              <th scope="col">Type</th>
              <th scope="col">Fee</th>
              <th scope="col">Value</th>
              <th scope="col">To</th>
              <th scope="col">From</th>
            </tr>
          </thead>
        <tbody id="theTransactions">
        </tbody>
        </table>
        `
    // document.querySelector('#table-of-fransactions').innerHTML = table
    $('#table-of-fransactions').append(table)

    transactions.result.forEach((t) => {
      let content = `
            <tr>
                <td><a href='${url}${
        t.hash
      }' target="_blank" rel="noopener noreferrer">${t.hash}</a></td>
                <td><a href='${url}${
        t.block_number
      }' target="_blank" rel="noopener noreferrer">${t.block_number}</a></td>
                <td>${millisecondsToTime(
                  Date.parse(new Date()) - Date.parse(t.block_timestamp),
                )}</td>
                <td>${
                  t.from_address == Moralis.User.current().get('ethAddress')
                    ? 'Outgoing'
                    : 'Incoming'
                }</td>
                <td>${((t.gas * t.gas_price) / 1e18).toFixed(5)} ETH</td>
                <td>${(t.value / 1e18).toFixed(5)} ETH</td>
                <td>${t.to_address}</td>
                <td>${t.from_address}</td>
            </tr>
            `
      theTransactions.innerHTML += content
    })
  }
}

const getNativeBalances = async () => {
  const ethBalance = await Moralis.Web3API.account.getNativeBalance()
  const ropstenBalance = await Moralis.Web3API.account.getNativeBalance({
    chain: 'ropsten',
  })
  const rinkebyBalance = await Moralis.Web3API.account.getNativeBalance({
    chain: 'rinkeby',
  })
  const binanceBalance = await Moralis.Web3API.account.getNativeBalance({
    chain: 'bsc',
  })
  const avalancheBalance = await Moralis.Web3API.account.getNativeBalance({
    chain: 'avalanche',
  })
  const polygonBalance = await Moralis.Web3API.account.getNativeBalance({
    chain: 'matic',
  })

  $('#userBalances').append(`
    <table class="table">
        <thead>
            <tr>
                <th scope="col">Chain</th>
                <th scope="col">Balance</th>

            </tr>
        </thead>
        <tbody>
            <tr>
                <th>Ether</th>
                <td>${(ethBalance.balance / 1e18).toFixed(5)} ETH</td>
            </tr>
            <tr>
                <th>Polygon</th>
                <td>${(polygonBalance.balance / 1e18).toFixed(5)} MATIC</td>
            </tr>
            <tr>
                <th>Binance</th>
                <td>${(binanceBalance.balance / 1e18).toFixed(5)} BNB</td>
            </tr>
            <tr>
                <th>Avalanche</th>
                <td>${(avalancheBalance.balance / 1e18).toFixed(5)} AVAX</td>
            </tr>
            <tr>
                <th>Ropsten</th>
                <td>${(ropstenBalance.balance / 1e18).toFixed(5)} ETH</td>
            </tr>
            <tr>
                <th>Rinkeby</th>
                <td>${(rinkebyBalance.balance / 1e18).toFixed(5)} ETH</td>
            </tr>
        </tbody>
    </table>
    `)
}

const getERC20Balances = async () => {
  let chain = identifyChain()

  let tokens = await Moralis.Web3API.account.getTokenBalances({ chain: chain })
  // console.log('tokens', tokens)
  let otherBalancesContent = document.querySelector('#otherBalances')
  otherBalancesContent.innerHTML = ''

  if (tokens.length > 0) {
    let tokenBalanceContent = ''

    tokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>${chain}</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
}

const getNFTs = async () => {
  let chainOption = $('#nft-chain').val()
  if (chainOption == 'none') {
    return alert('Choose a chain from the dropdown list')
  }

  let nfts = await Moralis.Web3API.account.getNFTs({ chain: chainOption })
  let tableOfNFTs = document.querySelector('#tableOfNFTs')
  tableOfNFTs.innerHTML = ''

  if (nfts.result.length > 0) {
    nfts.result.forEach((nft) => {
      let url = nft.token_uri
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          // for image previously used:  <img src="${fixURL(data.image_url)}" class="card-img-top" height=300>
          let content = `
                <div class="outer nfts>
                  <div class="inner nfts">
                    <div class="card col-md-4 nfts" 
                                data-id="${nft.token_id}" 
                                data-address="${nft.token_address}" 
                                data-type="${nft.contract_type}">
                        <img src="${data.image}" class="card-img-top nfts" alt="...">
                          <div class="card-body">
                          <h5 class="card-title">${data.name}</h5>
                          <p class="card-text">${data.description}</p>
                          <h6 class="card-title">Token Address</h6>
                          <p class="card-text">${nft.token_address}</p>
                          <h6 class="card-title">Token ID</h6>
                          <p class="card-text">${nft.token_id}</p>
                          <h6 class="card-title">Contract Type</h6>
                          <p class="card-text">${nft.contract_type}</p>
                        </div>
                    </div>
                  </div>
                </div>
                    `
          tableOfNFTs.innerHTML += content
        })
    })
  } else
    tableOfNFTs.innerHTML += `<p class="h5 m-3 text-center">You have no nfts to display from on the ${chainOption} chain</p>`
}

const getTransferNFTs = async () => {
  let chain = $('#nft-chain2').val()
  if (chain == 'empty') {
    return alert('Choose a chain from the dropdown list')
  } else {
    await Moralis.Web3API.account
      .getNFTs({ chain: chain })
      .then((nfts) => displayNftToTransfer(nfts))
  }
}

const displayNftToTransfer = async (nfts) => {
  let tableOfNFTs = document.querySelector('#NFTtable2')

  if (nfts.result.length == 0) {
    tableOfNFTs.innerHTML += `<p class="h5 m-3 text-center">You have no NFTs on the chain you selected.</p>`
  }

  if (nfts.result.length > 0) {
    tableOfNFTs.innerHTML =
      "<div class='col-md-12'><p class='m-3 text-center'>👇 Click on an NFT you wish to transfer. 👇</p></div>"
    for (let eachNft of nfts.result) {
      let metadata = JSON.parse(eachNft.metadata)
      let content = `
                  <div class="card col-md-4 nfts" data-id="${eachNft.token_id}" data-address="${eachNft.token_address}" data-type="${eachNft.contract_type}">
                    <img src="${metadata.image}" class="card-img-top" height=200>
                    <div class="card-body">
                      <h5 class="card-title">${metadata.name}</h5>
                      <h6 class="card-title">Description</h6>
                      <p class="card-text">${metadata.description}</p>
                      <h6 class="card-title">Token Address</h6>
                      <p class="card-text">${eachNft.token_address}</p>
                      <p class="card-text"><b>Token ID:</b> ${eachNft.token_id}</p>
                      <p class="card-text"><b>Contract Type:</b> ${eachNft.contract_type}</p>
                      <p class="card-text"><b>Available Balance:</b> ${eachNft.amount}</p>
                    </div>
                  </div>
                  `
      tableOfNFTs.innerHTML += content
    }
  }

  setTimeout(function () {
    let theNFTs = document.getElementsByClassName('nfts')
    for (let i = 0; i <= theNFTs.length - 1; i++) {
      // console.log('attributes', theNFTs[i].attributes)
      theNFTs[i].onclick = function () {
        $('#nft-transfer-token-id').val(theNFTs[i].attributes[1].value)
        $('#nft-transfer-type').val(
          theNFTs[i].attributes[3].value.toLowerCase(),
        )
        $('#nft-transfer-contract-address').val(theNFTs[i].attributes[2].value)
        if (theNFTs[i].attributes[3].value.toLowerCase() == 'erc721') {
          $('#nft-transfer-amount').val(1)
        }
      }
    }
  }, 1000)
}

const getERC20Metadata = async () => {
  let _symbol = document.querySelector('#ERC20MetadataSymbol').value
  let _chain = document.querySelector('#ERC20MetadataChain').value
  if (_symbol == '' || _chain == '') {
    return alert('Please enter a symbol and chain')
  }
  const options = { chain: _chain, symbols: _symbol }
  let tokens = await Moralis.Web3API.token.getTokenMetadataBySymbol(options)
  $('#ERC20Output').empty()
  tokens.forEach((e, i) => {
    if (e.symbol == _symbol) {
      let address = e.address
      let symbol = e.symbol
      let name = e.name
      let decimals = e.decimals
      let logo = e.logo
      let thumbnail = e.thumbnail
      let validated = e.validated
      let logoHash = e.logo_hash
      if (logoHash) {
        if (validated == null) {
          $('#ERC20Output').append(
            `<div class="card col-md-6 metadataCard">
              <img src="${thumbnail}" class="card-img-top" alt="token thumbnail">
              <h5 class="card-title">Token Name: ${name}</h5>
              <div class="card-body">
                <p class="card-text">Symbol: ${symbol}</p>
                <p class="card-text">Decimals: ${decimals}</p>
                <p class="card-text">Contract Address: ${address}</p>
              </div>
            </div>`,
          )
        } else {
          $('#ERC20Output').append(
            `<div class="card col-md-6 metadataCard">
              <img src="${thumbnail}" class="card-img-top" alt="token thumbnail">
              <h5 class="card-title">Token Name: ${name}</h5>
              <div class="card-body">              
                <p class="card-text">Symbol: ${symbol}</p>
                <p class="card-text">Decimals: ${decimals}</p>
                <p class="card-text">Contract Address: ${address}</p>
                <p class="card-text">${validated}</p>
              </div>
            </div>`,
          )
        }
      } else {
        $('#ERC20Output').append(
          `<div class="card col-md-6 metadataCard">
            <h1 style="color: red">WARNING NOT VERIFIED</h1>
            <h5 class="card-title">Token Name: ${name}</h5>
            <div class="card-body">              
              <p class="card-text">Symbol: ${symbol}</p>
              <p class="card-text">Decimals: ${decimals}</p>
              <p class="card-text">Contract Address: ${address}</p>
              <p class="card-text">Verify token on chain scanner (etherscan, etc.) before using.</p>
            </div>
          </div>`,
        )
      }
    }
  })
  if (tokens.length == 0) {
    $('#ERC20Output').append(
      `We can't seem to find token with symbol: ${_symbol}`,
    )
  }
}

const getERC20MetadataByAddress = async () => {
  let address = $('#ERC20MetadataAddress').val()
  let chain = $('#ERC20MetadataChainByAddress').val()
  if (address == '' || chain == '') {
    return alert('Please enter an address and chain')
  }
  const options = { chain: chain, addresses: address }
  let tokens = await Moralis.Web3API.token.getTokenMetadata(options)
  $('#ERC20Output').empty()
  console.log(tokens)
  tokens.forEach((e, i) => {
    if (e.address == address) {
      let address = e.address
      let symbol = e.symbol
      let name = e.name
      let decimals = e.decimals
      let logo = e.logo
      let thumbnail = e.thumbnail
      let validated = e.validated
      let logoHash = e.logo_hash
      // check to see if there is a logoHash
      if (logoHash) {
        if (validated == null) {
          $('#ERC20Output').append(
            `<div class="card col-md-6 metadataCard">
              <img src="${thumbnail}" class="card-img-top" alt="token thumbnail">
              <h5 class="card-title">Token Name: ${name}</h5>
              <div class="card-body">
                <p class="card-text">Symbol: ${symbol}</p>
                <p class="card-text">Decimals: ${decimals}</p>
                <p class="card-text">Contract Address: ${address}</p>
              </div>
            </div>`,
          )
        } else {
          $('#ERC20Output').append(
            `<div class="card col-md-6 metadataCard">
              <img src="${thumbnail}" class="card-img-top" alt="token thumbnail">
              <h5 class="card-title">Token Name: ${name}</h5>
              <div class="card-body">              
                <p class="card-text">Symbol: ${symbol}</p>
                <p class="card-text">Decimals: ${decimals}</p>
                <p class="card-text">Contract Address: ${address}</p>
                <p class="card-text">${validated}</p>
              </div>
            </div>`,
          )
        }
      } else {
        $('#ERC20Output').append(
          `<div class="card col-md-6 metadataCard">
            <h1 style="color: red">WARNING NOT VERIFIED</h1>
            <h5 class="card-title">Token Name: ${name}</h5>
            <div class="card-body">              
              <p class="card-text">Symbol: ${symbol}</p>
              <p class="card-text">Decimals: ${decimals}</p>
              <p class="card-text">Contract Address: ${address}</p>
              <p class="card-text">Verify token on chain scanner (etherscan, etc.) before using.</p>
            </div>
          </div>`,
        )
      }
    }
  })
  if (tokens.length == 0) {
    $('#ERC20Output').append(
      `We can't seem to find token with address: ${address}`,
    )
  }
}

// DISPLAY FUNCTIONS
const tokenBalanceLoop = (tokens) => {
  let tokenBalanceContent = ''

  tokens.forEach((e, i) => {
    let content = `

            <tr>
            <td>Token: ${e.name}</td>
            <td>Symbol: ${e.symbol}</td>
            <td>Balance: ${e.balance / '1e' + e.decimals} ETH</td>
            <td>Decimals: ${e.decimals}</td>
            <td>Contract Address: ${e.token_address}</td>
            </tr>

            `
    tokenBalanceContent += content
  })
  return tokenBalanceContent
}

const displayTransactions = () => {
  renderContent('#transactionsSection')
}

const displayTransactions2 = () => {
  renderContent('#tableOfNFTs2')
}

const displayBalances = () => {
  renderContent('#balancesSection')
}

const displayNFTs = () => {
  renderContent('#nftSection')
}

const displayTransferETH = () => {
  renderContent('#transferETH')
}

const displaytransferERC20 = () => {
  renderContent('#transferERC20')
}

const displaytransferNFTs = () => {
  renderContent('#transferNFTs')
}

const displayERC20Metadata = () => {
  renderContent('#ERC20MetadataContent')
}

const displayBuyCrypto = () => {
  renderContent('#buyCrypto')
}

const displaySwapTokens = () => {
  renderContent('#swapTokens')
  let chain = identifyChain()
  if (chain != 'eth') {
    alert('You can only swap on Ethereum Mainnet')
  }
}

const displayPortfolioTracker = () => {
  renderContent('#portfolioTracker')
  // launch()
}

const displayTradingAlerts = () => {
  renderContent('#tradingAlerts')
}

// TRANSFER FUNCTIONS
const transferETH = async () => {
  let _amount = String(document.querySelector('#amountOfETH').value)
  let _address = $('#addressToReceive').val()

  const options = {
    type: 'native',
    amount: Moralis.Units.ETH(_amount),
    receiver: _address,
  }

  $('.spinner-border').show()

  try {
    let result = await Moralis.transfer(options)

    if (result) {
      $('.spinner-border').hide()
      $('#userEthBalance').empty()
      $('#userEthBalance').append(
        `<p class="h5 m-3 text-center">You have successfully transferred ${_amount} ETH to ${_address}</p>`,
      )
      $('#userEthBalance').show()
    } else {
      $('#userEthBalance').text(result.message)
    }
  } catch (error) {
    console.error(error.message)
  }
}

const transferERC20 = async () => {
  let _amount = String(document.querySelector('#ERC20TransferAmount').value)
  let _decimals = String(document.querySelector('#ERC20TransferDecimals').value)
  let _address = String(document.querySelector('#ERC20TransferAddress').value)
  let _contract = String(document.querySelector('#ERC20TransferContract').value)

  const options = {
    type: 'erc20',
    amount: Moralis.Units.Token(_amount, _decimals),
    receiver: _address,
    contract_address: _contract,
  }
  $('.spinner-border').show()
  try {
    let result = await Moralis.transfer(options)
    if (result) {
      $('.spinner-border').hide()
      $('#erc20TransferNotice').append(
        `<p class="h5 m-3 text-center">You have successfully transferred ${_amount} to ${_address}</p>`,
      )
      $('#erc20TransferNotice').show()
      console.log(result)
    } else {
      $('#erc20TransferNotice').text(result.message)
    }
  } catch (error) {
    console.error(error.message)
  }
}

const getTransferERC20Balances = async () => {
  let ethTokens = await Moralis.Web3API.account.getTokenBalances()
  let ropstenTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'ropsten',
  })
  let rinkebyTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'rinkeby',
  })
  let avalancheTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'avalanche',
  })
  let binanceTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'bsc',
  })
  let polygonTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'matic',
  })

  let balancesContent = document.querySelector('#transferERC20Balances')
  balancesContent.innerHTML = ''

  let tokenBalanceContent = ''

  if (ethTokens.length > 0) {
    console.log('eth', ethTokens.length)
    ethTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>Ethereum Mainnet</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${e.symbol}
                </button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
  }
  if (polygonTokens.length > 0) {
    console.log('eth', polygonTokens.length)
    polygonTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>Polygon</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${e.symbol}
                </button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
  }
  if (binanceTokens.length > 0) {
    console.log('eth', binanceTokens.length)
    binanceTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>Binance</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${e.symbol}
                </button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
  }
  if (ropstenTokens.length > 0) {
    console.log('ropsten', ropstenTokens.length)
    ropstenTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>Ropsten</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${e.symbol}
                </button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
  }
  if (rinkebyTokens.length > 0) {
    console.log('rinkeby', rinkebyTokens.length)
    rinkebyTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>Rinkeby</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${e.symbol}
                </button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
  }
  if (avalancheTokens.length > 0) {
    console.log('avalanche', avalancheTokens.length)
    avalancheTokens.forEach((e, i) => {
      // to add decimals and address input the following in the table
      //  <td>${e.decimals}</td>
      // <td>${e.token_address}</td>
      let content = `
                  <tr>
                  <td>${e.name}</td>
                  <td>${e.symbol}</td>
                  <td>${e.balance / ('1e' + e.decimals)} </td>
                  <td>Avalanche</td>
                  <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                    e.decimals
                  }" data-address="${e.token_address}">Transfer ${e.symbol}
                  </button></td>
                  </tr>
      
                  `
      tokenBalanceContent += content
    })
  }
  balancesContent.innerHTML += tokenBalanceContent

  setTimeout(function () {
    let theBalances = document.getElementsByClassName('transfer-button')

    for (let i = 0; i <= theBalances.length - 1; i++) {
      theBalances[i].onclick = function () {
        $('.hiddenInput').show()

        document.querySelector('#ERC20TransferDecimals').value =
          theBalances[i].attributes[1].value
        document.querySelector('#ERC20TransferContract').value =
          theBalances[i].attributes[2].value
      }
    }
  }, 1000)
}

const transferNFTs = async () => {
  const type = $('#nft-transfer-type').val()
  const recipient = $('#nft-transfer-receiver').val()
  const contract_address = $('#nft-transfer-contract-address').val()
  const amount = $('#nft-transfer-amount').val()
  const token_id = $('#nft-transfer-token-id').val()

  const options = {
    type: type,
    receiver: recipient,
    contract_address: contract_address,
    token_id: token_id,
    amount: amount,
  }
  console.log(options)
  try {
    $('.spinner-border').show()
    let result = await Moralis.transfer(options)
    console.log('result', result)
    $('#tableOfNFTs2').empty()
    $('#tableOfNFTs2').append(
      `<p>Your token has successfully transferred to ${recipient}. Here is your transaction information:</p>
      <ul>
        <li>Transaction Hash: ${result.transactionHash}</li>
        <li>Block Number: ${result.blockNumber}</li>
        <li>Block Hash: ${result.blockHash}</li>
        <li>Gas Used: ${result.gasUsed}</li>
      </ul>
    `,
    )
    $('.spinner-border').hide()
  } catch (error) {
    console.error(error.message)
  }
}

// PORTFOLIO FUNCTIONS
async function launch() {
  $('.spinner').show()
  let response = await fetch('https://gateway.ipfs.io/ipns/tokens.uniswap.org')
  let names = await response.json()
  toks = names.tokens

  // instead of the above fetching tokens from uniswap, we can grab user's tokens to for selection

  // additionally, we can grab all tokens and amounts and creating an agregate list of all tokens, amounts and prices to display in a chart

  toks.forEach((e, i) =>
    document.getElementById('list').add(new Option(e.symbol, i)),
  )
  priceHistory()
}

// function to get all user's tokens and their balances and then push those into priceHistory() for charting
async function getMyTokenPortfolio() {
  let chain = identifyChain()

  let tokens = await Moralis.Web3API.account.getTokenBalances({ chain: chain })
  // console.log('tokens', tokens)

  //tokens will return an array of objects and each object will give us the token address, balance, decimals, and name. We will loop through this to get the price of each token

  tokens.forEach((e, i) => {
    let addrs = e.token_address
    let balance = e.balance
    let decimals = e.decimals
    let name = e.name
    getPriceHistory(chain, addrs, balance, decimals, name)
  })
}

let totalValueArray = []
let portfolioValue

async function getPriceHistory(chain, addrs, balance, decimals, name) {
  let currentPriceArray = []

  const priceObject = await Moralis.Web3API.token.getTokenPrice({
    chain: chain,
    address: addrs,
  })
  let price = priceObject.usdPrice

  // calculate the USD value of each token based on the amount the user holds
  let usdValue = (balance * price) / ('1e' + decimals)

  let currentPrice = {
    name: name,
    balance: balance,
    decimals: decimals,
    price: price,
    usdValue: usdValue,
  }
  // console.log('priceHistory', currentPrice)
  currentPriceArray.push(currentPrice)
  totalValueArray.push(usdValue)

  // now that we have the current price of each token stored in an array of objects, we will loop through this array and display the data in a table
  for (i = 0; i < currentPriceArray.length; i++) {
    let tokenBalance =
      currentPriceArray[i].balance / ('1e' + currentPriceArray[i].decimals)
    tokenBalance = tokenBalance.toFixed(6)
    let tokenPrice = currentPriceArray[i].price.toFixed(4)
    let usdValue = currentPriceArray[i].usdValue.toFixed(6)
    //  grab table element and append the data to it, making sure it adheres to the table structure and spacing (using jquery)
    $('#portfolioTable').append(
      `
      <tr>
      <td scope="col-md-3" class="portfolioTableItem">${currentPriceArray[i].name}</td>
      <td scope="col-md-3" class="portfolioTableItem">${tokenBalance}</td>
      <td scope="col-md-3" class="portfolioTableItem">$ ${tokenPrice}</td>
      <td scope="col-md-3" class="portfolioTableItem">$ ${usdValue}</td>
      </tr>
      `,
    )
  }

  getHoldingValue(totalValueArray)
}

async function getHoldingValue(totalValueArray) {
  let totalValue = totalValueArray.reduce((a, b) => a + b, 0)
  // get the final calculation
  portfolioValue = totalValue

  setTimeout(function () {
    $('#totalPortfolioValue').html(
      `TOTAL HOLDING: $${portfolioValue.toFixed(2)}.`,
    )
  }, 1000)
}

// function to graph the price history of a token
async function priceHistory() {
  $('.spinner').show()
  let chain = identifyChain()
  let days = document.querySelector('input[name="time"]:checked').value
  let i = document.getElementById('list').value
  let addrs = toks[i].address
  let sym = toks[i].symbol
  let today = new Date()

  let dates = []
  let blocks = []
  let prices = []

  // then take the input of days from user and calculate the dates. For example, if user inputs 7 days, then the dates will be 7 days before today
  let startDate = new Date(today.setDate(today.getDate() - days))

  // insert those dates into dates array
  for (let i = 0; i < days; i++) {
    let date = new Date(startDate.setDate(startDate.getDate() + 1))
    let dateString = date.toISOString().split('T')[0]
    dates.push(dateString)
    // console.log('dates', dates)

    const dateToBlock = await Moralis.Web3API.native.getDateToBlock({
      date: dateString,
    })
    let block = dateToBlock.block
    blocks.push(block)
    // console.log('blocks', blocks)

    const priceObject = await Moralis.Web3API.token.getTokenPrice({
      chain: chain,
      address: addrs,
      to_block: blocks[i],
    })
    let price = priceObject.usdPrice
    prices.push(price)
    // console.log('prices', prices)
  }

  const data = {
    labels: dates,
    datasets: [
      {
        label: `${sym} prices over the last ${days} days in USD.`,
        backgroundColor: 'rgba(0,0,0,0.025)',
        borderColor: 'rgb(255, 99, 132)',
        data: prices,
      },
    ],
  }

  const config = {
    type: 'line',
    data: data,
    options: {},
  }

  if (window.myChart instanceof Chart) {
    myChart.destroy()
  }

  $('.spinner').hide()
  window.myChart = new Chart(document.getElementById('myChart'), config)
}

// DASHBOARD LISTENERS
if (window.location.href == dashboard) {
  $('#get-transactions-link').on('click', displayTransactions)
  $('#btn-get-transactions').on('click', getTransactions)

  $('#get-balances-link').on('click', displayBalances)
  $('#btn-get-native-balances').on('click', getNativeBalances)

  $('#btn-get-erc20-balances').on('click', getERC20Balances)
  $('#ERC20MetadataSearch').on('click', getERC20Metadata)

  $('#get-nfts-link').on('click', displayNFTs)
  $('#btn-get-nfts').on('click', getNFTs)

  $('#transfer-ETH').on('click', displayTransferETH)
  $('#ETHTransferButton').on('click', transferETH)

  $('#transfer-ERC20').on('click', displaytransferERC20)
  $('#ERC20TransferButton').on('click', transferERC20)

  $('#transfer-nfts').on('click', displaytransferNFTs)
  $('#btn-get-transactions2').on('click', getTransferNFTs)

  $('#btn-transfer-selected-nft').on('click', transferNFTs)

  $('#swap-tokens-link').on('click', displaySwapTokens)

  $('#buy-crypto-link').on('click', displayBuyCrypto)

  $('#portfolio-tracker-link').on('click', displayPortfolioTracker)

  $('#trading-alerts-link').on('click', displayTradingAlerts)

  $('#transferERC20GetBalances').on('click', function () {
    $('#transferERC20BalanceTable').show()
    getTransferERC20Balances()
  })

  $('#ERC20MetadataSearchByAddress').on('click', getERC20MetadataByAddress)

  $('#show-ERC20-metadata').on('click', displayERC20Metadata)

  $('#searchTokenPriceBtn').on('click', launch)

  $('#showMyPortfolioBtn').on('click', function () {
    getMyTokenPortfolio()
  })

  $('#btn-clear-screen').on('click', function () {
    // clear the screen
    $('#myChart').hide()
    $('#list').empty()
  })

  // Class listeners
  let buttons = $('.clearButton')
  for (var i = 0; i <= buttons.length - 1; i += 1) {
    buttons[i].onclick = function (e) {
      clearContent(this.name)
    }
  }

  $('#btn-clear-transactions').on('click', function () {
    $('#table-of-fransactions').hide()
    $('#transactions-amount').hide()
  })
}

// HOMEPAGE LISTENERS
if (window.location.href == homepage) {
  document.querySelector('#btn-login').onclick = login
}

document.getElementById('week').onclick = priceHistory
document.getElementById('2week').onclick = priceHistory
document.getElementById('4week').onclick = priceHistory
document.getElementById('list').onchange = priceHistory

// open/close sidebar
$('#sidebarMenuMinMaxButton').on('click', function () {
  // if sidebar is collapsed
  if (document.getElementById('sidebarMenu').style.width == '50px') {
    $('#sidebarMenu').addClass('collapsed')
    document.getElementById('sidebarMenu').style.width = '200px'
    $('#sidebarMenuMinMaxButton').html(
      '<i class="fas fa-angle-double-left"></i>',
    )
    // show all h5 elements
    $('#sidebarMenu h5').show()

    // turn all icons within links back to the default
    $('#get-transactions-link').html(
      '<i class="fas fa-cash-register"></i> Transactions',
    )
    $('#get-balances-link').html('<i class="fas fa-wallet"></i> Token Balances')
    $('#get-nfts-link').html('<i class="fas fa-id-card"></i> NFT Holdings')
    $('#transfer-ETH').html('<i class="fas fa-exchange-alt"></i> Transfer ETH')
    $('#transfer-ERC20').html('<i class="fas fa-sync"></i> Transfer Tokens')
    $('#transfer-nfts').html(
      '<i class="fas fa-hand-holding-usd"></i> Transfer NFT',
    )
    $('#show-ERC20-metadata').html('<i class="fas fa-code"></i> Token Metadata')
    $('#buy-crypto-link').html(
      '<i class="fas fa-shopping-cart"></i> Buy Crypto',
    )
    $('#swap-tokens-link').html('<i class="fas fa-random"></i> Swap Tokens')
    $('#portfolio-tracker-link').html(
      '<i class="fas fa-chart-line"></i> Portfolio Tracker',
    )
    $('#trading-alerts-link').html('<i class="fas fa-bell"></i> Trading Alerts')

    // $('#get-transactions-link') should be a link with cursor pointer
    $('#get-transactions-link').css('cursor', 'pointer')
    $('#get-transactions-link').css('font-weight', '500')
    $('#get-transactions-link').on('click', displayTransactions)
  }
  // if the bar is expanded
  else {
    $('#sidebarMenu').removeClass('collapsed')
    document.getElementById('sidebarMenu').style.width = '50px'
    $('#sidebarMenuMinMaxButton').html(
      '<i class="fas fa-angle-double-right"></i>',
    )
    // hide all h5 elements from the sidebar
    $('#sidebarMenu h5').hide()

    // turn all wording inside the links to icons
    $('#get-transactions-link').html('<i class="fas fa-cash-register"></i>')
    $('#get-balances-link').html('<i class="fas fa-wallet"></i>')
    $('#get-nfts-link').html('<i class="fas fa-id-card"></i>')
    $('#transfer-ETH').html('<i class="fas fa-exchange-alt"></i>')
    $('#transfer-ERC20').html('<i class="fas fa-sync"></i>')
    $('#transfer-nfts').html('<i class="fas fa-hand-holding-usd"></i>')
    $('#show-ERC20-metadata').html('<i class="fas fa-code"></i>')
    $('#buy-crypto-link').html('<i class="fas fa-shopping-cart"></i>')
    $('#swap-tokens-link').html('<i class="fas fa-random"></i>')
    $('#portfolio-tracker-link').html('<i class="fas fa-chart-line"></i>')
    $('#trading-alerts-link').html('<i class="fas fa-bell"></i>')

    // adjust padding for $('#get-transactions-link')
    $('#get-transactions-link').css('padding-left', '16px')

    // all links still have same click attributes
    $('#get-transactions-link').on('click', displayTransactions)
    $('#get-balances-link').on('click', displayBalances)
    $('#get-nfts-link').on('click', displayNFTs)
    $('#transfer-ETH').on('click', displayTransferETH)
    $('#transfer-ERC20').on('click', displaytransferERC20)
    $('#transfer-nfts').on('click', displaytransferNFTs)
    $('#show-ERC20-metadata').on('click', displayERC20Metadata)
    $('#buy-crypto-link').on('click', displayBuyCrypto)
    $('#swap-tokens-link').on('click', displaySwapTokens)
    $('#portfolio-tracker-link').on('click', displayPortfolioTracker)
    $('#trading-alerts-link').on('click', displayTradingAlerts)
  }
})
