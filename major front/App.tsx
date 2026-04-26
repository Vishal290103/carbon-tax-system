import { useState, useEffect } from 'react';
import { web3Service, SystemStats } from './src/services/web3Service';
import { paymentService } from './src/services/paymentService';
import { API_BASE_URL } from './src/config';
import { Wallet, ShoppingCart, Coins, TrendingUp, Leaf, Shield, BarChart3, Calculator, Eye } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

// Import new components
import { WalletConnection } from './components/WalletConnection';
import { CarbonCalculator } from './components/CarbonCalculator';
import { TransparencyPortal } from './components/TransparencyPortal';
import { ProductPurchaseModal } from './components/ProductPurchaseModal';
import { TransactionGuide } from './components/TransactionGuide';
import { EthRequirement } from './components/EthRequirement';
import { ValidatorDashboard } from './components/ValidatorDashboard';

interface Product {
  id: number;
  name: string;
  basePrice: number;
  carbonTax: number;
  co2Emission: number;
  category: string;
  description?: string;
  manufacturer?: string;
  image?: string;
}

export default function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'products' | 'validator' | 'transparency' | 'calculator' | 'wallet'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await web3Service.initialize();
    await checkWalletConnection();
    await loadSystemStats();
    await loadProducts();
  };

  const checkWalletConnection = async () => {
    if (web3Service.isConnected()) {
      setIsWalletConnected(true);
      setUserAddress(web3Service.getUserAddress());
      await loadBalances();
    }
  };

  const loadBalances = async () => {
    try {
      const [eth, token] = await Promise.all([
        web3Service.getBalance(),
        web3Service.getTokenBalance()
      ]);
      setEthBalance(eth);
      setTokenBalance(token);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const stats = await web3Service.getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      // Fetch products from the Backend API (Render) instead of the Blockchain
      // This ensures we get images, categories, and full metadata
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Map backend products and filter out duplicates by ID
        const uniqueProducts = new Map();
        
        data.forEach((p: any) => {
          if (!uniqueProducts.has(p.id)) {
            uniqueProducts.set(p.id, {
              id: p.id,
              name: p.name,
              basePrice: p.price / 200000,
              carbonTax: p.tax / 200000,
              co2Emission: p.tax * 2,
              category: p.category || 'General',
              description: p.description,
              manufacturer: p.manufacturer || 'Verified Manufacturer',
              image: p.image
            });
          }
        });
        
        setProducts(Array.from(uniqueProducts.values()));
      }
    } catch (error) {
      console.error('Error loading products from API:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleConnectWallet = async () => {
    const address = await web3Service.connectWallet();
    if (address) {
      setIsWalletConnected(true);
      setUserAddress(address);
      await loadBalances();
    }
  };

  const handleDisconnectWallet = () => {
    web3Service.disconnect();
    setIsWalletConnected(false);
    setUserAddress('');
    setEthBalance('0');
    setTokenBalance('0');
  };

  const handlePurchaseProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowPurchaseModal(true);
  };

  const formatAddress = (address: string) => {    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (value: string | number, decimals: number = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Carbon Tax Blockchain System</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isWalletConnected ? (
                <button
                  onClick={handleConnectWallet}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <div>{formatAddress(userAddress)}</div>
                    <div>{formatNumber(ethBalance)} ETH | {formatNumber(tokenBalance)} CTT</div>
                  </div>
                  <button
                    onClick={handleDisconnectWallet}
                    className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'home', label: 'Home', icon: Leaf },
              { id: 'products', label: 'Products', icon: ShoppingCart },
              { id: 'calculator', label: 'Carbon Calculator', icon: Calculator },
              { id: 'validator', label: 'Validator', icon: Shield },
              { id: 'transparency', label: 'Transparency', icon: Eye },
              { id: 'wallet', label: 'Wallet', icon: Wallet }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                    currentView === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Home View */}
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Carbon Tax Blockchain System
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                A transparent, blockchain-based carbon tax system using Ethereum Proof of Stake consensus. 
                Every transaction is recorded immutably, ensuring complete transparency and preventing corruption.
              </p>
            </div>

            {/* System Stats */}
            {systemStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tax Collected</p>
                    <p className="text-2xl font-bold text-green-600">
                      {paymentService.formatINR(paymentService.convertEthToINR(parseFloat(systemStats.totalTaxCollected)))}
                    </p>
                  </div>
                    <Coins className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Funds Allocated</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {paymentService.formatINR(paymentService.convertEthToINR(parseFloat(systemStats.totalFundsAllocated)))}
                    </p>
                  </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Products</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {systemStats.activeProducts}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Validators</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {systemStats.totalValidators}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Key Features */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Proof of Stake</h3>
                <p className="text-gray-600">
                  Energy-efficient consensus mechanism where validators stake tokens to secure the network and earn rewards.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <BarChart3 className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Full Transparency</h3>
                <p className="text-gray-600">
                  Every carbon tax transaction is recorded on the blockchain, providing complete visibility into fund allocation.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Green Projects</h3>
                <p className="text-gray-600">
                  Collected taxes automatically fund renewable energy projects, creating a transparent environmental impact.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products View */}
        {currentView === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Products with Carbon Tax</h2>
              <button
                onClick={loadProducts}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refresh Products
              </button>
            </div>
            
            {/* ETH Requirements */}
            <EthRequirement />
            
            {/* Transaction Guide */}
            <TransactionGuide />
            
            {isLoadingProducts ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products from blockchain...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 bg-yellow-50 rounded-lg">
                <p className="text-yellow-800">No products found on the blockchain.</p>
                <p className="text-sm text-yellow-600 mt-2">Products need to be added to the smart contract first.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
                    {product.image && (
                      <div className="h-48 w-full overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          {product.category}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4 flex-1">
                        <p className="text-gray-600 flex justify-between">
                          <span>Base Price:</span>
                          <span>{paymentService.formatINR(paymentService.convertEthToINR(product.basePrice))}</span>
                        </p>
                        <p className="text-red-600 flex justify-between">
                          <span>Carbon Tax:</span>
                          <span>{paymentService.formatINR(paymentService.convertEthToINR(product.carbonTax))}</span>
                        </p>
                        <p className="text-sm text-gray-500 flex justify-between border-t pt-2">
                          <span>Est. Emissions:</span>
                          <span>{product.co2Emission}g CO₂</span>
                        </p>
                        <p className="font-bold text-green-600 flex justify-between text-lg">
                          <span>Total:</span>
                          <span>{paymentService.formatINR(paymentService.convertEthToINR(product.basePrice + product.carbonTax))}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handlePurchaseProduct(product)}
                        disabled={!isWalletConnected}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors shadow-sm"
                      >
                        {!isWalletConnected ? 'Connect Wallet' : 'Purchase with Transparency'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Validator View */}
        {currentView === 'validator' && <ValidatorDashboard />}

        {/* Carbon Calculator View */}
        {currentView === 'calculator' && <CarbonCalculator />}

        {/* Transparency View */}
        {currentView === 'transparency' && <TransparencyPortal />}

        {/* Wallet View */}
        {currentView === 'wallet' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Wallet Management</h2>
            <WalletConnection 
              onWalletConnected={(address) => {
                setIsWalletConnected(true);
                setUserAddress(address);
                loadBalances();
              }}
              onWalletDisconnected={() => {
                setIsWalletConnected(false);
                setUserAddress('');
                setEthBalance('0');
                setTokenBalance('0');
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>🎓 Carbon Tax Blockchain System - College Project</p>
            <p className="text-sm">Ethereum Proof of Stake • Transparent • Anti-Corruption</p>
          </div>
        </div>
      </footer>
      
      {/* Product Purchase Modal */}
      <ProductPurchaseModal
        product={selectedProduct}
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          setSelectedProduct(null);
        }}
      />
      
      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}
