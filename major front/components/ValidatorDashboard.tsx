import { useState, useEffect } from 'react';
import { web3Service } from '../src/services/web3Service';
import { 
  Shield, 
  Info
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Modal } from './ui/Modal';
import { MockTokenFaucet } from './MockTokenFaucet';
import toast from 'react-hot-toast';

interface ValidatorStats {
  isValidator: boolean;
  stakedAmount: string;
  pendingRewards: string;
  totalValidators: number;
  myValidatorRank: number;
}

export function ValidatorDashboard() {
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [validatorStats, setValidatorStats] = useState<ValidatorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaking, setIsStaking] = useState(false);
  const [showStakingModal, setShowStakingModal] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [demoMode, setDemoMode] = useState(false);
  const [demoTokenBalance, setDemoTokenBalance] = useState('0');

  useEffect(() => {
    initDashboard();
  }, []);

  // Auto-refresh rewards every 10 seconds
  useEffect(() => {
    if ((validatorStats?.isValidator || demoMode) && !isLoading) {
      const interval = setInterval(() => {
        loadValidatorData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [validatorStats?.isValidator, demoMode, isLoading]);

  const initDashboard = async () => {
    setIsLoading(true);
    try {
      const address = await web3Service.getUserAddress();
      if (address) {
        setUserAddress(address);
        await loadValidatorData(address);
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadValidatorData = async (address: string = userAddress) => {
    if (!address) return;
    try {
      const tokens = await web3Service.getTokenBalance();
      setTokenBalance(tokens);

      const validatorInfo = await web3Service.getValidatorInfo(address);
      const systemStats = await web3Service.getSystemStats();
      const rewards = await web3Service.calculateReward(address);
      
      const validatorRank = 1;

      setValidatorStats({
        isValidator: (validatorInfo ? validatorInfo.isActive : false) || demoMode,
        stakedAmount: (validatorInfo ? validatorInfo.stakedAmount : '0') || (demoMode ? '1000' : '0'),
        pendingRewards: demoMode ? (parseFloat(rewards) + 0.05).toFixed(4) : rewards,
        totalValidators: systemStats ? systemStats.totalValidators : 0,
        myValidatorRank: validatorRank
      });
    } catch (error) {
      console.error('Error loading validator data:', error);
    }
  };

  const handleStake = async () => {
    if (demoMode) {
      setIsStaking(true);
      setTimeout(() => {
        setIsStaking(false);
        setDemoTokenBalance((parseFloat(demoTokenBalance) - 1000).toString());
        setValidatorStats(prev => prev ? {
          ...prev,
          isValidator: true,
          stakedAmount: '1000',
          myValidatorRank: 1
        } : null);
        toast.success('Successfully staked in Demo Mode!');
        setShowStakingModal(false);
      }, 1500);
      return;
    }

    setIsStaking(true);
    try {
      const success = await web3Service.stakeTokens('1000');
      if (success) {
        toast.success('Tokens staked successfully!');
        setShowStakingModal(false);
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Staking error:', error);
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      const success = await web3Service.claimRewards();
      if (success) {
        toast.success('Rewards claimed!');
        await loadValidatorData();
      }
    } catch (error) {
      console.error('Claim rewards error:', error);
    }
  };

  const handleDemoTokens = () => {
    setDemoMode(true);
    setDemoTokenBalance('2000');
    toast.success('Demo mode activated!');
  };

  const getDisplayTokenBalance = () => demoMode ? demoTokenBalance : tokenBalance;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Validator Dashboard</h2>
        <Button onClick={() => loadValidatorData()} variant="secondary" size="sm">Refresh Data</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>My Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-xl">
              <div className={`p-4 rounded-full ${validatorStats?.isValidator ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Shield className={`h-12 w-12 ${validatorStats?.isValidator ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{(validatorStats?.isValidator || demoMode) ? 'Active Validator' : 'Not a Validator'}</h3>
                <p className="text-gray-600">Secure the network and earn carbon credits</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Staked Amount</p>
                <p className="text-2xl font-bold text-blue-600">{validatorStats?.stakedAmount || '0'} CTT</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Pending Rewards</p>
                <p className="text-2xl font-bold text-green-600">{validatorStats?.pendingRewards || '0'} CTT</p>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <Button onClick={() => setShowStakingModal(true)} disabled={validatorStats?.isValidator} className="flex-1">Stake Tokens</Button>
              <Button onClick={handleClaimRewards} disabled={!validatorStats?.isValidator} variant="secondary" className="flex-1">Claim Rewards</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Network Stats</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between"><span>Active Validators</span><span className="font-bold">{validatorStats?.totalValidators || 0}</span></div>
                <div className="flex justify-between"><span>My Rank</span><span className="font-bold">#{validatorStats?.myValidatorRank || '-'}</span></div>
              </div>
            </CardContent>
          </Card>
          <MockTokenFaucet onTokensReceived={handleDemoTokens} />
        </div>
      </div>

      <Modal isOpen={showStakingModal} onClose={() => setShowStakingModal(false)} title="Stake CTT Tokens">
        <div className="space-y-6 p-2">
          <div className="p-4 bg-blue-50 rounded-lg flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800">Staking 1000 CTT tokens is required to become a validator.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stake Amount</label>
            <input type="number" value="1000" readOnly className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg" />
            <p className="text-xs text-gray-500 mt-2">Balance: {getDisplayTokenBalance()} CTT</p>
          </div>
          <Button onClick={handleStake} disabled={isStaking || parseFloat(getDisplayTokenBalance()) < 1000} className="w-full py-4">
            {isStaking ? 'Processing...' : 'Confirm Staking'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
