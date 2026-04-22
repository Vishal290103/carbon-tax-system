import { useState, useEffect } from 'react';
import { web3Service, Validator } from '../src/services/web3Service';
import { paymentService } from '../src/services/paymentService';
import { 
  Shield, 
  Coins, 
  TrendingUp, 
  Users, 
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MockTokenFaucet } from './MockTokenFaucet';
import { TokenPurchaseModal } from './TokenPurchaseModal';

interface ValidatorStats {
  isValidator: boolean;
  stakedAmount: string;
  pendingRewards: string;
  totalValidators: number;
  networkStaked: string;
  myValidatorRank: number;
  annualRewardRate: number;
}

export function ValidatorDashboard() {
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [validatorStats, setValidatorStats] = useState<ValidatorStats | null>(null);
  const [activeValidators, setActiveValidators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState<string>('1000');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoTokenBalance, setDemoTokenBalance] = useState('0');
  const [showTokenPurchaseModal, setShowTokenPurchaseModal] = useState(false);

  useEffect(() => {
    if (web3Service.isConnected()) {
      loadValidatorData();
    }
  }, []);

  const loadValidatorData = async () => {
    setIsLoading(true);
    try {
      const userAddress = web3Service.getUserAddress();
      
      // Load balances
      const [eth, tokens] = await Promise.all([
        web3Service.getBalance(),
        web3Service.getTokenBalance()
      ]);
      
      setEthBalance(eth);
      setTokenBalance(tokens);

      // Load validator info
      const validatorInfo = await web3Service.getValidatorInfo(userAddress);
      const systemStats = await web3Service.getSystemStats();
      const validators = await web3Service.getActiveValidators();
      
      setActiveValidators(validators);
      
      // Calculate pending rewards
      const pendingRewards = await web3Service.calculateReward(userAddress);
      
      // Get validator rank (position in validator list)
      const validatorRank = validators.indexOf(userAddress) + 1;
      
      setValidatorStats({
        isValidator: validatorInfo ? validatorInfo.isActive : false,
        stakedAmount: validatorInfo ? validatorInfo.stakedAmount : '0',
        pendingRewards: pendingRewards,
        totalValidators: systemStats ? systemStats.totalValidators : 0,
        networkStaked: '50000', // Mock for now
        myValidatorRank: validatorRank > 0 ? validatorRank : 0,
        annualRewardRate: 5.2 // 5.2% annual reward
      });

    } catch (error) {
      console.error('Error loading validator data:', error);
      toast.error('Error loading validator data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStake = async () => {
    if (!web3Service.isConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (amount < 1000) {
      toast.error('Minimum stake is 1000 CTT tokens');
      return;
    }

    const displayBalance = getDisplayTokenBalance();
    if (amount > parseFloat(displayBalance)) {
      toast.error('Insufficient token balance');
      return;
    }

    setIsStaking(true);
    try {
      if (demoMode) {
        // Demo mode - simulate staking
        toast.loading('Simulating staking transaction...', { id: 'demo-stake' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update demo balance
        const newBalance = (parseFloat(demoTokenBalance) - amount).toString();
        setDemoTokenBalance(newBalance);
        
        // Simulate becoming a validator
        toast.success('Demo: Successfully staked tokens! You are now a validator.', { id: 'demo-stake' });
        
        // Update validator stats for demo
        setValidatorStats(prev => prev ? {
          ...prev,
          isValidator: true,
          stakedAmount: amount.toString(),
          myValidatorRank: 1
        } : null);
      } else {
        // Real mode - actual blockchain transaction
        const success = await web3Service.stakeTokens(stakeAmount);
        if (success) {
          toast.success('Successfully staked tokens! You are now a validator.');
          await loadValidatorData(); // Refresh data
        }
      }
    } catch (error) {
      console.error('Staking error:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!validatorStats?.isValidator) {
      toast.error('You are not currently a validator');
      return;
    }

    setIsUnstaking(true);
    try {
      const success = await web3Service.unstakeTokens();
      if (success) {
        toast.success('Successfully unstaked tokens');
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Unstaking error:', error);
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!validatorStats?.isValidator) {
      toast.error('You are not currently a validator');
      return;
    }

    if (parseFloat(validatorStats.pendingRewards) === 0) {
      toast.error('No rewards to claim');
      return;
    }

    setIsClaimingRewards(true);
    try {
      const success = await web3Service.claimRewards();
      if (success) {
        toast.success('Successfully claimed rewards!');
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Claim rewards error:', error);
    } finally {
      setIsClaimingRewards(false);
    }
  };

  const handleRequestTokens = async () => {
    try {
      const success = await web3Service.requestTokens('2000');
      if (success) {
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Request tokens error:', error);
    }
  };

  const handleBuyTokens = async () => {
    try {
      const success = await web3Service.buyTokensWithETH('2000');
      if (success) {
        // Since this is a simulation, activate demo mode
        setDemoMode(true);
        setDemoTokenBalance('2000');
        toast.success('Demo mode activated with your ETH purchase simulation!', {
          duration: 3000
        });
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Buy tokens error:', error);
    }
  };

  const handleDemoTokens = () => {
    setDemoMode(true);
    setDemoTokenBalance('2000');
    toast.success('Demo mode activated! You now have 2000 CTT tokens to test with.', {
      duration: 4000
    });
  };

  const getDisplayTokenBalance = () => {
    return demoMode ? demoTokenBalance : tokenBalance;
  };

  const formatNumber = (value: string | number, decimals: number = 2) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(decimals);
  };

  const formatINRFromETH = (ethAmount: string | number) => {
    const inrAmount = paymentService.convertEthToINR(typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount);
    return paymentService.formatINR(inrAmount);
  };

  const calculateDailyRewards = () => {
    if (!validatorStats) return '0';
    const staked = parseFloat(validatorStats.stakedAmount);
    const dailyRate = validatorStats.annualRewardRate / 365 / 100;
    return (staked * dailyRate).toFixed(4);
  };

  if (!web3Service.isConnected()) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto">
          <Shield className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-yellow-800 mb-2">
            Wallet Connection Required
          </h3>
          <p className="text-yellow-700 mb-4">
            Connect your wallet to access validator functionality and start earning rewards by securing the network.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Connect Wallet to Continue
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading validator data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Validator Dashboard</h2>
          {demoMode && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              🎭 Demo Mode Active - Testing validator functionality
            </p>
          )}
        </div>
        <button
          onClick={loadValidatorData}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
      

      {/* Validator Status */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${validatorStats?.isValidator ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Shield className={`h-8 w-8 ${validatorStats?.isValidator ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {(validatorStats?.isValidator || demoMode) ? '✅ Active Validator' : '⛭️ Not a Validator'}
                {demoMode && !validatorStats?.isValidator && parseFloat(getDisplayTokenBalance()) >= 1000 && ' (Ready to Stake)'}
              </h3>
              <p className="text-gray-600">
                {(validatorStats?.isValidator || (demoMode && validatorStats?.isValidator)) 
                  ? `Validator #${validatorStats?.myValidatorRank || 1} • Earning rewards by securing the network${demoMode ? ' (Demo)' : ''}`
                  : 'Stake 1000+ CTT tokens to become a validator and start earning rewards'
                }
              </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Coins className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">CTT Balance</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatNumber(getDisplayTokenBalance())}</p>
          <p className="text-xs text-gray-500">{formatINRFromETH(getDisplayTokenBalance())} equivalent</p>
          {demoMode && <p className="text-xs text-blue-600 font-medium">Demo Mode</p>}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-600">ETH Balance</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(ethBalance, 6)}</p>
          <p className="text-xs text-gray-500">{formatINRFromETH(ethBalance)} equivalent</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-600">Staked Amount</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(validatorStats?.stakedAmount || '0')}</p>
          <p className="text-xs text-gray-500">CTT staked for validation</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-gray-600">Pending Rewards</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatNumber(validatorStats?.pendingRewards || '0')}</p>
          <p className="text-xs text-gray-500">{formatINRFromETH(validatorStats?.pendingRewards || '0')} equivalent</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Token Management */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Coins className="h-5 w-5 text-green-600" />
            <span>Token Management</span>
          </h3>
          
          {parseFloat(getDisplayTokenBalance()) < 1000 && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Need More Tokens</span>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                You need at least 1000 CTT tokens to become a validator.
              </p>
              <div className="space-y-3">
                <div>
                  <button
                    onClick={handleRequestTokens}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors mb-1"
                  >
                    Get Free Tokens (Owner Only)
                  </button>
                  <p className="text-xs text-yellow-600">Requires contract owner permissions</p>
                </div>
                
                <div>
                  <button
                    onClick={() => setShowTokenPurchaseModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors mb-1"
                  >
                    💳 Buy CTT with ETH
                  </button>
                  <p className="text-xs text-blue-600">Purchase CTT tokens with Ethereum (1 ETH = 1000 CTT)</p>
                </div>
              </div>
              
              {/* Token Faucet */}
              <div className="mt-4">
                <MockTokenFaucet 
                  onTokensReceived={handleDemoTokens} 
                  currentBalance={getDisplayTokenBalance()}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stake Amount (CTT)
              </label>
              <input
                type="number"
                min="1000"
                step="100"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 1000 CTT • Available: {formatNumber(getDisplayTokenBalance())} CTT
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStake}
                disabled={isStaking || parseFloat(getDisplayTokenBalance()) < parseFloat(stakeAmount) || validatorStats?.isValidator}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {isStaking ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Staking...</span>
                  </div>
                ) : validatorStats?.isValidator ? 'Already Staked' : 'Stake Tokens'}
              </button>

              <button
                onClick={handleUnstake}
                disabled={isUnstaking || !validatorStats?.isValidator}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm transition-colors"
              >
                {isUnstaking ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Unstaking...</span>
                  </div>
                ) : 'Unstake All'}
              </button>
            </div>
          </div>
        </div>

        {/* Rewards Management */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Award className="h-5 w-5 text-orange-600" />
            <span>Rewards Management</span>
          </h3>

          <div className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-orange-800">Pending Rewards</span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatNumber(validatorStats?.pendingRewards || '0')} CTT
                </span>
              </div>
              <p className="text-sm text-orange-700">
                ≈ {formatINRFromETH(validatorStats?.pendingRewards || '0')} in INR value
              </p>
            </div>

            {validatorStats?.isValidator && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Earnings:</span>
                  <span className="font-medium">{calculateDailyRewards()} CTT/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Rate:</span>
                  <span className="font-medium text-green-600">{validatorStats.annualRewardRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Staked:</span>
                  <span className="font-medium">{formatNumber(validatorStats.stakedAmount)} CTT</span>
                </div>
              </div>
            )}

            <button
              onClick={handleClaimRewards}
              disabled={isClaimingRewards || !validatorStats?.isValidator || parseFloat(validatorStats?.pendingRewards || '0') === 0}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isClaimingRewards ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Claiming...</span>
                </div>
              ) : 'Claim Rewards'}
            </button>
          </div>
        </div>
      </div>

      {/* Network Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span>Network Statistics</span>
        </h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{validatorStats?.totalValidators || 0}</p>
              <p className="text-sm text-gray-600">Active Validators</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-green-50 p-4 rounded-lg">
              <Coins className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatNumber(validatorStats?.networkStaked || '0')}</p>
              <p className="text-sm text-gray-600">Total Staked CTT</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-purple-50 p-4 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{validatorStats?.annualRewardRate || 0}%</p>
              <p className="text-sm text-gray-600">Annual Reward Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Info className="h-5 w-5 text-blue-600" />
          <span>How Validator Rewards Work</span>
        </h4>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Stake CTT Tokens</p>
                <p className="text-gray-600">Lock your tokens to become a validator and help secure the network</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Earn Daily Rewards</p>
                <p className="text-gray-600">Receive rewards automatically for validating transactions</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Energy Efficient</p>
                <p className="text-gray-600">Proof of Stake uses 99.9% less energy than Proof of Work</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Award className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Claim Anytime</p>
                <p className="text-gray-600">Withdraw your earned rewards whenever you want</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        isOpen={showTokenPurchaseModal}
        onClose={() => setShowTokenPurchaseModal(false)}
        onPurchaseComplete={async () => {
          await loadValidatorData();
          setShowTokenPurchaseModal(false);
        }}
      />
    </div>
  );
}
