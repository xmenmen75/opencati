import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ExternalLink, AlertCircle } from 'lucide-react'
import { getMetaMaskErrorMessage } from '@/lib/wallet-utils'

// BNB Smart Chain Testnet configuration
const BSC_TESTNET = {
  chainId: '0x61', // 97 in decimal
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
}

interface WalletState {
  isConnected: boolean
  account: string | null
  balance: string | null
  chainId: string | null
  isLoading: boolean
  error: string | null
}

export function WalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    balance: null,
    chainId: null,
    isLoading: false,
    error: null,
  })

  // Store references to event handlers for cleanup
  const accountsChangedHandler = useRef<(...args: unknown[]) => void>(null!);
  const chainChangedHandler = useRef<(...args: unknown[]) => void>(null!);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await provider.listAccounts()
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          const balance = await provider.getBalance(address)
          const network = await provider.getNetwork()
          
          setWalletState({
            isConnected: true,
            account: address,
            balance: ethers.formatEther(balance),
            chainId: `0x${network.chainId.toString(16)}`,
            isLoading: false,
            error: null,
          })
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error)
    }
  }

  const connectWallet = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.')
      }

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])

      // Check if we're on BSC Testnet
      const network = await provider.getNetwork()
      const currentChainId = `0x${network.chainId.toString(16)}`

      if (currentChainId !== BSC_TESTNET.chainId) {
        // Try to switch to BSC Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_TESTNET.chainId }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BSC_TESTNET],
            })
          } else {
            throw switchError
          }
        }
      }

      // Get updated provider after network switch
      const updatedProvider = new ethers.BrowserProvider(window.ethereum)
      const signer = await updatedProvider.getSigner()
      const address = await signer.getAddress()
      const balance = await updatedProvider.getBalance(address)
      const updatedNetwork = await updatedProvider.getNetwork()

      setWalletState({
        isConnected: true,
        account: address,
        balance: ethers.formatEther(balance),
        chainId: `0x${updatedNetwork.chainId.toString(16)}`,
        isLoading: false,
        error: null,
      })

      // Listen for account changes
      window.ethereum.on('accountsChanged', accountsChangedHandler.current)
      window.ethereum.on('chainChanged', chainChangedHandler.current)

    } catch (error: unknown) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: getMetaMaskErrorMessage(error),
      }))
    }
  }

  const handleAccountsChanged = (...args: unknown[]) => {
    const accounts = args[0] as string[];
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletState({
        isConnected: false,
        account: null,
        balance: null,
        chainId: null,
        isLoading: false,
        error: null,
      })
    } else {
      // Account changed
      checkConnection()
    }
  }

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload()
  }

  // Initialize handlers
  accountsChangedHandler.current = handleAccountsChanged;
  chainChangedHandler.current = handleChainChanged;

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      account: null,
      balance: null,
      chainId: null,
      isLoading: false,
      error: null,
    })
    
    // Remove event listeners
    if (window.ethereum && accountsChangedHandler.current && chainChangedHandler.current) {
      window.ethereum.removeListener('accountsChanged', accountsChangedHandler.current)
      window.ethereum.removeListener('chainChanged', chainChangedHandler.current)
    }
  }

  const isCorrectNetwork = walletState.chainId === BSC_TESTNET.chainId

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-6 w-6" />
            MetaMask Wallet
          </CardTitle>
          <CardDescription>
            Connect to BNB Smart Chain Testnet
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {walletState.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4" />
              {walletState.error}
            </div>
          )}

          {!walletState.isConnected ? (
            <Button 
              onClick={connectWallet} 
              disabled={walletState.isLoading}
              className="w-full"
              size="lg"
            >
              {walletState.isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
          ) : (
            <div className="space-y-4">
              {!isCorrectNetwork && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Please switch to BNB Smart Chain Testnet
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 p-2 rounded font-mono break-all">
                      {walletState.account}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://testnet.bscscan.com/address/${walletState.account}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Balance</label>
                  <div className="text-2xl font-bold">
                    {parseFloat(walletState.balance || '0').toFixed(4)} tBNB
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Network</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'}`} />
                    {isCorrectNetwork ? 'BNB Smart Chain Testnet' : 'Wrong Network'}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={disconnectWallet}
                variant="outline" 
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          )}

          <div className="pt-4 border-t text-center">
            <p className="text-xs text-gray-500">
              Need testnet BNB?{' '}
              <a 
                href="https://testnet.binance.org/faucet-smart"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Get from faucet
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
