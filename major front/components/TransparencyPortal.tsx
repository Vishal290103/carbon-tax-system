import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  Eye, 
  DollarSign, 
  MapPin, 
  ExternalLink, 
  Download,
  TrendingUp,
  Users,
  Leaf,
  Shield,
  CheckCircle,
  ShoppingCart,
  Wallet
} from 'lucide-react';
import { web3Service, Transaction } from '../src/services/web3Service';
import { paymentService } from '../src/services/paymentService';
import { localTransactionService, INRTransaction } from '../src/services/localTransactionService';

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  fundingAllocated: number;
  fundingUsed: number;
  status: 'planning' | 'active' | 'completed';
  co2Reduction: number;
  beneficiaries: number;
}

export function TransparencyPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'projects' | 'validators'>('overview');
  const [_transactions, setTransactions] = useState<Transaction[]>([]);
  const [inrTransactions, setInrTransactions] = useState<INRTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalTaxCollected: 0,
    totalAllocated: 0,
    activeProjects: 0,
    totalValidators: 0,
    co2Reduced: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  const [isConnected, setIsConnected] = useState(web3Service.isConnected());

  useEffect(() => {
    const handleAccountsChanged = () => {
      setIsConnected(web3Service.isConnected());
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadTransparencyData();
    }
  }, [isConnected]); // Only load data when connected
  
  // Listen for transaction completion events to refresh data
  useEffect(() => {
    const handleTransactionCompleted = () => {
      loadTransparencyData();
    };
    
    window.addEventListener('transactionCompleted', handleTransactionCompleted);
    
    return () => {
      window.removeEventListener('transactionCompleted', handleTransactionCompleted);
    };
  }, []);

  const loadTransparencyData = async () => {
    setIsLoading(true);
    try {
      // Load INR transactions from local storage (always available)
      const localInrTransactions = localTransactionService.getAllTransactions();
      setInrTransactions(localInrTransactions);
      
      // Load blockchain transactions only if wallet is connected
      let validTransactions: Transaction[] = [];
      if (web3Service.isConnected()) {
        const userAddress = web3Service.getUserAddress();
        const userTransactionIds = await web3Service.getUserTransactions(userAddress);

        console.log("Transaction IDs:", userTransactionIds);

        const userTransactions = await Promise.all(
          userTransactionIds.map(async (txId) => {
            const tx = await web3Service.getTransaction(txId);
            return tx;
          })
        );

        console.log("Transactions:", userTransactions);
        validTransactions = userTransactions.filter((tx) => tx !== null) as Transaction[];
      }
      
      setTransactions(validTransactions);

      // Mock project data
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Metropolitan Solar Farm',
          description: 'Large-scale solar installation providing clean energy for 10,000 homes',
          location: 'Phoenix, Arizona',
          fundingAllocated: 850000,
          fundingUsed: 680000,
          status: 'active',
          co2Reduction: 5200,
          beneficiaries: 10000
        },
        {
          id: '2',
          name: 'Coastal Wind Project',
          description: 'Offshore wind turbines generating renewable electricity',
          location: 'Cape Cod, Massachusetts',
          fundingAllocated: 1200000,
          fundingUsed: 1200000,
          status: 'completed',
          co2Reduction: 8400,
          beneficiaries: 15000
        },
        {
          id: '3',
          name: 'Urban Forest Initiative',
          description: 'Tree planting and urban green space development',
          location: 'Portland, Oregon',
          fundingAllocated: 300000,
          fundingUsed: 120000,
          status: 'active',
          co2Reduction: 1800,
          beneficiaries: 25000
        }
      ];

      setProjects(mockProjects);

      // Calculate combined stats from both INR and blockchain transactions
      const inrStats = localTransactionService.getTransactionStats();
      
      let blockchainStats = {
        totalTaxCollected: 0,
        totalAllocated: 0,
        activeProducts: 0,
        totalValidators: 0
      };
      
      if (web3Service.isConnected()) {
        const stats = await web3Service.getSystemStats();
        if (stats) {
          blockchainStats = {
            totalTaxCollected: parseFloat(stats.totalTaxCollected),
            totalAllocated: parseFloat(stats.totalFundsAllocated),
            activeProducts: stats.activeProducts,
            totalValidators: stats.totalValidators
          };
        }
      }
      
      setTotalStats({
        totalTaxCollected: inrStats.totalCarbonTaxINR, // Use INR stats
        totalAllocated: inrStats.totalCarbonTaxINR, // Assume all tax is allocated
        activeProjects: 3, // Mock data
        totalValidators: blockchainStats.totalValidators,
        co2Reduced: inrStats.totalCO2Emission / 1000 // Convert to kg
      });
    } catch (error) {
      console.error("Error loading transparency data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // For INR transactions, amount is already in INR
    return paymentService.formatINR(amount);
  };
  
  const _formatEthCurrency = (amount: number) => {
    // Convert ETH amount to INR for display (for blockchain transactions)
    const inrAmount = paymentService.convertEthToINR(amount);
    return paymentService.formatINR(inrAmount);
  };

  const _formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (_productId: number) => {
    // This is a placeholder. You might want to have a way to get the product category.
    return <ShoppingCart className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      planning: { color: 'bg-yellow-100 text-yellow-800', text: 'Planning' },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'transactions', label: 'Transactions', icon: DollarSign },
    { id: 'projects', label: 'Projects', icon: Leaf },
    { id: 'validators', label: 'Validators', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Transparency Portal</h2>
        <p className="text-xl text-gray-600">
          Real-time transparency for carbon tax collection and allocation
        </p>
        {/* Debug info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="text-blue-800">
            📊 Found {inrTransactions.length} INR transaction(s) | 
            {web3Service.isConnected() ? '🔗 Wallet Connected' : '💳 Payment Mode'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {!isConnected ? (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto">
            <Wallet className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Connection Required
            </h3>
            <p className="text-yellow-700 mb-4">
              Connect your wallet to view transaction history and transparency data. 
              All transactions in this system require blockchain recording for complete transparency.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Connect Wallet to Continue
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center">
          <p>Loading blockchain data...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tax Collected</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(totalStats.totalTaxCollected)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Funds Allocated</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency(totalStats.totalAllocated)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Active Projects</p>
                      <p className="text-xl font-bold text-green-600">
                        {totalStats.activeProjects}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Validators</p>
                      <p className="text-xl font-bold text-purple-600">
                        {totalStats.totalValidators}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <Leaf className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">CO₂ Reduced</p>
                      <p className="text-xl font-bold text-green-600">
                        {totalStats.co2Reduced.toLocaleString()}t
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transaction Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {inrTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {inrTransactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(tx.productId)}
                            <div>
                              <p className="font-medium">INR Purchase - {tx.productName}</p>
                              <p className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">Total: {formatCurrency(tx.totalAmount)}</p>
                            <p className="font-semibold text-red-600">Tax: {formatCurrency(tx.carbonTax)}</p>
                            <p className="text-xs text-gray-500">Payment: {tx.paymentMethod.toUpperCase()}</p>
                            {tx.blockchainTxHash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${tx.blockchainTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center"
                              >
                                Blockchain <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">No transactions yet</p>
                      <p className="text-sm text-gray-400">Make your first purchase to see transactions here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Transaction Records</CardTitle>
                  <Button variant="secondary" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {inrTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Product</th>
                          <th className="text-left py-2">Total Amount</th>
                          <th className="text-left py-2">Carbon Tax</th>
                          <th className="text-left py-2">Payment Method</th>
                          <th className="text-left py-2">Date & Time</th>
                          <th className="text-left py-2">Verification</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inrTransactions.map((tx) => (
                          <tr key={tx.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                {getTransactionIcon(tx.productId)}
                                <div>
                                  <span className="text-sm font-medium">{tx.productName}</span>
                                  <p className="text-xs text-gray-500">{tx.co2Emission}g CO₂</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 font-medium">{formatCurrency(tx.totalAmount)}</td>
                            <td className="py-3 font-medium text-red-600">{formatCurrency(tx.carbonTax)}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tx.paymentMethod.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-sm">
                              {new Date(tx.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col space-y-1">
                                <span className="text-xs text-gray-600 font-mono">
                                  Payment: {tx.paymentTransactionId.slice(0, 12)}...
                                </span>
                                {tx.blockchainTxHash ? (
                                  <a
                                    href={`https://sepolia.etherscan.io/tx/${tx.blockchainTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline flex items-center text-xs"
                                  >
                                    Blockchain <ExternalLink className="h-3 w-3 ml-1" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400">Payment only</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No transactions yet</p>
                    <p className="text-sm text-gray-400">Make your first purchase to see transaction records here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {getStatusBadge(project.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">{project.description}</p>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{project.location}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Funding Progress</span>
                            <span>{Math.round((project.fundingUsed / project.fundingAllocated) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(project.fundingUsed / project.fundingAllocated) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{formatCurrency(project.fundingUsed)} used</span>
                            <span>{formatCurrency(project.fundingAllocated)} allocated</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div className="text-center">
                            <p className="text-lg font-bold text-green-600">{project.co2Reduction.toLocaleString()}t</p>
                            <p className="text-xs text-gray-600">CO₂ Reduced</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-600">{project.beneficiaries.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">Beneficiaries</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Validators Tab */}
          {activeTab === 'validators' && (
            <Card>
              <CardHeader>
                <CardTitle>Proof of Stake Validators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">24</p>
                      <p className="text-sm text-gray-600">Active Validators</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">524,000</p>
                      <p className="text-sm text-gray-600">Total Staked CTT</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">5.2%</p>
                      <p className="text-sm text-gray-600">APY Reward</p>
                    </div>
                  </div>

                  {/* Sample Validator List */}
                  <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Validator #{i + 1}</p>
                            <p className="text-sm text-gray-500 font-mono">0xVAL{String(i + 1).padStart(4, '0')}...{Math.random().toString(36).substr(2, 4)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Active</span>
                          </div>
                          <p className="text-sm text-gray-600">{(20000 + i * 5000).toLocaleString()} CTT staked</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}