console.log('hello world')

// MY SERVER
Moralis.initialize('y7bQ8aZvO2XR51Scwuafav2tJ13V0qDQpqw90TXd')
Moralis.serverURL = 'https://zrsca4lyqk9t.moralishost.com:2053/server'

let homepage = 'http://127.0.0.1:5500/index.html'
let dashboard = 'http://127.0.0.1:5500/dashboard.html'

// REDIRECT USER BASED ON STATUS
const currentUser = Moralis.User.current()
console.log('user', currentUser)
if (currentUser) {
  $('#btn-toDashboard').show()
  $('#loginDisplay').hide()
  $('#greetLoggedInUser').append(
    `<h1>Welcome ${currentUser.get('username')}</h1>`,
  )
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
  let chain = $('#transactions-chain').val()
  console.log('chain', chain)
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

  let content = (document.querySelector('#userBalances').innerHTML = `
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

  $('#userEthBalance').append(content)
}

const getERC20Balances = async () => {
  let ethTokens = await Moralis.Web3API.account.getTokenBalances()
  let ropstenTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'ropsten',
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
  let rinkebyTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'rinkeby',
  })

  let otherBalancesContent = document.querySelector('#otherBalances')
  otherBalancesContent.innerHTML = ''

  if (ethTokens.length > 0) {
    let tokenBalanceContent = ''

    ethTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Ethereum</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
  if (avalancheTokens.length > 0) {
    let tokenBalanceContent = ''

    avalancheTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Avalanche</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
  if (polygonTokens.length > 0) {
    let tokenBalanceContent = ''

    polygonTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Polygon</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
  if (binanceTokens.length > 0) {
    let tokenBalanceContent = ''

    binanceTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Binance</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
  if (ropstenTokens.length > 0) {
    let tokenBalanceContent = ''

    ropstenTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Ropsten</td>
                <td>${e.token_address}</td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    otherBalancesContent.innerHTML += tokenBalanceContent
  }
  if (rinkebyTokens.length > 0) {
    let tokenBalanceContent = ''

    rinkebyTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} ${e.symbol}</td>
                <td>${e.decimals}</td>
                <td>Rinkeby</td>
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
  alert('This feature is coming soon')
}

const getERC20Metadata = async () => {
  let _symbol = document.querySelector('#ERC20MetadataSymbol').value
  let _chain = document.querySelector('#ERC20MetadataChain').value
  let tokens = await Moralis.Web3API.account.getTokenBalances({ chain: _chain })
  tokens.forEach((e, i) => {
    if (e.symbol == _symbol) {
      document.querySelector('#ERC20TransferContract').value = e.token_address
      document.querySelector('#ERC20TransferDecimals').value = e.decimals
    }
  })
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
  let result = await Moralis.transfer(options)
  console.log(result)
}

const getTransferERC20Balances = async () => {
  let ethTokens = await Moralis.Web3API.account.getTokenBalances()
  let ropstenTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'ropsten',
  })
  let rinkebyTokens = await Moralis.Web3API.account.getTokenBalances({
    chain: 'rinkeby',
  })

  let balancesContent = document.querySelector('#transferERC20Balances')
  balancesContent.innerHTML = ''

  if (ethTokens.length > 0) {
    // Enter your ETH mainnet code here - I only worked with rinkeby (see below)
  }
  if (ropstenTokens.length > 0) {
    // Enter your ropsten testnet code here - I only worked with rinkeby (see below)
  }
  if (rinkebyTokens.length > 0) {
    let tokenBalanceContent = ''

    rinkebyTokens.forEach((e, i) => {
      let content = `
    
                <tr>
                <td>${e.name}</td>
                <td>${e.symbol}</td>
                <td>${e.balance / ('1e' + e.decimals)} </td>
                <td>${e.decimals}</td>
                <td>${e.token_address}</td>
                <td><button class="btn btn-primary transfer-button col-md-12" data-decimals="${
                  e.decimals
                }" data-address="${e.token_address}">Transfer ${
        e.symbol
      }</button></td>
                </tr>
    
                `
      tokenBalanceContent += content
    })
    balancesContent.innerHTML += tokenBalanceContent

    setTimeout(function () {
      let theBalances = document.getElementsByClassName('transfer-button')

      for (let i = 0; i <= theBalances.length - 1; i++) {
        theBalances[i].onclick = function () {
          document.querySelector('#ERC20TransferDecimals').value =
            theBalances[i].attributes[1].value
          document.querySelector('#ERC20TransferContract').value =
            theBalances[i].attributes[2].value
        }
      }
    }, 1000)
  }
}

const transferNFTs = async () => {
  alert('This feature is coming soon')
}

// DASHBOARD LISTENERS
if (window.location.href == dashboard) {
  document.querySelector('#get-transactions-link').onclick = displayTransactions
  document.querySelector('#btn-get-transactions').onclick = getTransactions

  document.querySelector('#get-balances-link').onclick = displayBalances
  document.querySelector('#btn-get-native-balances').onclick = getNativeBalances

  document.querySelector('#btn-get-erc20-balances').onclick = getERC20Balances
  document.querySelector('#ERC20MetadataSearch').onclick = getERC20Metadata

  document.querySelector('#get-nfts-link').onclick = displayNFTs
  document.querySelector('#btn-get-nfts').onclick = getNFTs

  document.querySelector('#transfer-ETH').onclick = displayTransferETH
  document.querySelector('#ETHTransferButton').onclick = transferETH

  document.querySelector('#transfer-ERC20').onclick = displaytransferERC20
  document.querySelector('#ERC20TransferButton').onclick = transferERC20

  document.querySelector('#transfer-nfts').onclick = displaytransferNFTs
  document.querySelector('#btn-get-transactions2').onclick = getTransferNFTs

  document.querySelector('#btn-transfer-selected-nft').onclick = transferNFTs

  document.querySelector(
    '#transferERC20GetBalances',
  ).onclick = getTransferERC20Balances

  $('#transfer-ETH').on('click', function () {
    getNativeBalances()
  })

  // Class listeners
  let buttons = document.getElementsByClassName('clearButton')
  for (var i = 0; i <= buttons.length - 1; i += 1) {
    buttons[i].onclick = function (e) {
      console.log('clearButton', buttons[i], this.name)
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
