let currentTrade = {}
let currentSelectSide
let tokens

async function init() {
  await Moralis.initPlugins()
  await listAvailableTokens()
}

init()

function identifyChain() {
  let chain = window.ethereum['chainId']
  if (chain === '0x1') {
    chain = 'eth'
  } else if (chain === '0x2a') {
    chain = 'kovan'
  } else if (chain === '0x3') {
    chain = 'ropsten'
  } else if (chain === '0x4') {
    chain = 'rinkeby'
  } else if (chain === '0x5') {
    chain = 'goerli'
  } else if (chain === '0x89') {
    chain = 'matic'
  } else if (chain === '0x13881') {
    chain = 'mumbai'
  } else if (chain === '0x38') {
    chain = 'bsc'
  } else if (chain === '0xa86a') {
    chain = 'avalanche'
  } else if (chain === '0,61') {
    chain = 'bsc testnet'
  } else if (chain === '0x539') {
    chain = 'localdevchain'
  }
  // console.log('chain', chain)
  return chain
}

// function to reload the page on chain change
window.ethereum.on('chainChanged', () => {
  window.location.reload()
})

async function listAvailableTokens() {
  let chain = identifyChain()
  if (chain != 'eth') {
    alert('You can only swap on Ethereum Mainnet')
    return
  }
  const result = await Moralis.Plugins.oneInch.getSupportedTokens({
    chain: chain, // The blockchain you want to use (eth/bsc/polygon)
  })
  tokens = result.result.tokens

  let parent = document.getElementById('token_list')

  for (const address in tokens) {
    let token = tokens[address]
    let div = document.createElement('div')
    div.setAttribute('data-address', address)
    div.className = 'token_row'
    let html = `
        <img class="token_list_img" src="${token.logoURI}">
        <span class="token_list_text">${token.symbol}</span>
        `

    div.innerHTML = html
    div.onclick = () => {
      selectToken(address)
    }
    parent.appendChild(div)
  }
}

// automatically search for token symbol as the user inputs to #tokenSearch and trigger on keyup
function searchToken() {
  let search = document.getElementById('tokenSearch').value
  let parent = document.getElementById('token_list')
  let children = parent.children
  for (let i = 0; i < children.length; i++) {
    let child = children[i]
    let text = child.innerText
    if (text.toLowerCase().includes(search.toLowerCase())) {
      child.style.display = 'block'
    } else {
      child.style.display = 'none'
    }
  }
}

// on key up in #tokenSearch update the search results
document.getElementById('tokenSearch').onkeyup = () => {
  searchToken()
}

function selectToken(address) {
  closeModal()
  currentTrade[currentSelectSide] = tokens[address]
  document.getElementById('tokenSearch').value = ''
  renderInterface()
  getQuote()
}

async function renderInterface() {
  let balance = await getMySelectedTokenBalance(currentTrade.from.address)

  if (currentTrade.from) {
    document.getElementById('from_token_img').src = currentTrade.from.logoURI
    document.getElementById('from_token_text').innerHTML =
      currentTrade.from.symbol
    console.log(currentTrade.from)
    $('#holdingBalance').html(`Account balance: ${balance}`)
  }
  if (currentTrade.to) {
    document.getElementById('to_token_img').src = currentTrade.to.logoURI
    document.getElementById('to_token_text').innerHTML = currentTrade.to.symbol
  }
}

function openModal(side) {
  currentSelectSide = side
  document.getElementById('token_modal').style.display = 'block'
}

function closeModal() {
  document.getElementById('token_modal').style.display = 'none'
}

async function getQuote() {
  if (
    !currentTrade.from ||
    !currentTrade.to ||
    !document.getElementById('from_amount').value
  )
    return

  let amount = Number(
    document.getElementById('from_amount').value *
      10 ** currentTrade.from.decimals,
  )

  let chain = identifyChain()

  const quote = await Moralis.Plugins.oneInch.quote({
    chain: chain, // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address, // The token you want to swap
    toTokenAddress: currentTrade.to.address, // The token you want to receive
    amount: amount,
  })

  console.log('quoteResult', quote.result)

  let toAmount =
    quote.result.toTokenAmount / 10 ** quote.result.toToken.decimals
  toAmount = toAmount.toFixed(6)

  document.getElementById('gas_estimate').innerHTML = quote.result.estimatedGas
  document.getElementById('to_amount').value = toAmount
}

async function getMySelectedTokenBalance(tokenAddress) {
  let chain = identifyChain()
  let tokenBalances = await Moralis.Web3API.account.getTokenBalances({
    chain: chain,
  })
  console.log('tokenBalances', tokenBalances)
  const ethBalance = await Moralis.Web3API.account.getNativeBalance()
  console.log(ethBalance.balance)

  // loop through tokenBalances and find the token with the matching address
  for (let i = 0; i < tokenBalances.length; i++) {
    let token = tokenBalances[i]
    if (token.address === tokenAddress) {
      return token.balance
    }
  }
  // if no token found, return 0
  return 0
}

async function trySwap() {
  let chain = identifyChain()
  let address = Moralis.User.current().get('ethAddress')
  let amount = Number(
    document.getElementById('from_amount').value *
      10 ** currentTrade.from.decimals,
  )

  if (currentTrade.from.symbol !== 'ETH') {
    const allowance = await Moralis.Plugins.oneInch.hasAllowance({
      chain: chain, // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: currentTrade.from.address, // The token you want to swap
      fromAddress: address, // Your wallet address
      amount: amount,
    })
    console.log('allowance', allowance.result)
    if (allowance.result === false) {
      await Moralis.Plugins.oneInch.approve({
        chain: chain, // The blockchain you want to use (eth/bsc/polygon)
        tokenAddress: currentTrade.from.address, // The token you want to swap
        fromAddress: address, // Your wallet address
      })
    }
  }
  try {
    let receipt = await doSwap(address, amount)
    console.log(receipt)
    // if there is an error
    if (receipt.result.statusCode != 200) {
      alert(`ERROR: ${receipt.result.message}`)
    } else {
      alert(`Success: ${receipt.result.message}`)
    }
  } catch (error) {
    console.log(error)
  }
}

function doSwap(userAddress, amount) {
  let chain = identifyChain()
  return Moralis.Plugins.oneInch.swap({
    chain: chain, // The blockchain you want to use (eth/bsc/polygon)
    fromTokenAddress: currentTrade.from.address, // The token you want to swap
    toTokenAddress: currentTrade.to.address, // The token you want to receive
    amount: amount,
    fromAddress: userAddress, // Your wallet address
    slippage: 1,
  })
}

document.getElementById('modal_close').onclick = closeModal
document.getElementById('from_token_select').onclick = () => {
  openModal('from')
}
document.getElementById('to_token_select').onclick = () => {
  openModal('to')
}
document.getElementById('from_amount').onkeyup = getQuote
document.getElementById('swap_button').onclick = trySwap
