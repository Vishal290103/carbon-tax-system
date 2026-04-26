import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  Eye, 
  DollarSign, 
  MapPin, 
  ExternalLink, 
  TrendingUp,
  Users,
  Leaf,
  Shield,
  ShoppingCart
} from 'lucide-react';
import { web3Service } from '../src/services/web3Service';
import { paymentService } from '../src/services/paymentService';
import { localTransactionService, INRTransaction } from '../src/services/localTransactionService';
import { API_BASE_URL } from '../src/config';

interface Project {
  id: number;
  name: string;
  location: string;
  type: string;
  fundingGoal: number;
  fundingReceived: number;
  status: 'planning' | 'active' | 'completed';
  co2Reduction: number;
  beneficiaries: number;
}

export function TransparencyPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'projects' | 'validators'>('overview');
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

  useEffect(() => {
    loadTransparencyData();
    
    const handleRefresh = () => loadTransparencyData();
    window.addEventListener('transactionCompleted', handleRefresh);
    return () => window.removeEventListener('transactionCompleted', handleRefresh);
  }, []);

  const loadTransparencyData = async () => {
    setIsLoading(true);
    try {
      const localInrTx = localTransactionService.getAllTransactions();
      setInrTransactions(localInrTx);

      // Fetch projects from the Backend API (Render)
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects`);
      const projectData = await projectResponse.json();
      
      if (Array.isArray(projectData)) {
        const mappedProjects: Project[] = projectData.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location || 'India',
          type: p.type || 'Green Energy',
          fundingGoal: p.cost,
          fundingReceived: (p.cost * (p.progress || 0)) / 100,
          status: p.progress >= 100 ? 'completed' : 'active',
          co2Reduction: p.cost / 1000, // Estimate impact
          beneficiaries: p.cost / 100, // Estimate beneficiaries
          image: p.image // Ensure we have the image
        }));
        setProjects(mappedProjects);
      }

      const blockchainStats = await web3Service.getSystemStats();
      
      let inrTax = 0;
      localInrTx.forEach((tx: INRTransaction) => inrTax += tx.carbonTax);

      setTotalStats({
        totalTaxCollected: blockchainStats ? parseFloat(blockchainStats.totalTaxCollected) * 200000 + inrTax : inrTax,
        totalAllocated: 9500000,
        activeProjects: blockchainStats ? blockchainStats.activeProjects : (projectData.length || 0),
        totalValidators: blockchainStats ? blockchainStats.totalValidators : 0,
        co2Reduced: 7000
      });
    } catch (error) {
      console.error('Error loading transparency data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return paymentService.formatINR(amount);
  };

  const getTransactionIcon = () => {
    return <ShoppingCart className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      planning: { color: 'bg-yellow-100 text-yellow-800', text: 'Planning' },
      active: { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' }
    };
    const config = statusConfig[status];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.text}</span>;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Transparency Portal</h2>
          <p className="text-gray-600">Real-time public tracking of carbon tax funds and project allocations</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'transactions', label: 'Transactions', icon: DollarSign },
          { id: 'projects', label: 'Projects', icon: Leaf },
          { id: 'validators', label: 'Validators', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Tax Collected', value: formatCurrency(totalStats.totalTaxCollected), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Funds Allocated', value: formatCurrency(totalStats.totalAllocated), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Active Validators', value: totalStats.totalValidators, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-100' },
            { label: 'CO2 Reduced', value: `${totalStats.co2Reduced}g`, icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-100' }
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 font-semibold text-gray-600">Transaction</th>
                    <th className="pb-4 font-semibold text-gray-600">Product</th>
                    <th className="pb-4 font-semibold text-gray-600">Tax Paid</th>
                    <th className="pb-4 font-semibold text-gray-600">Blockchain Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {inrTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-4"><div className="flex items-center space-x-3">{getTransactionIcon()}<span className="font-mono text-xs">{tx.id.substring(0, 12)}...</span></div></td>
                      <td className="py-4">{tx.productName}</td>
                      <td className="py-4 font-medium text-green-600">{formatCurrency(tx.carbonTax)}</td>
                      <td className="py-4">
                        {tx.blockchainTxHash ? (
                          <a href={`https://sepolia.etherscan.io/tx/${tx.blockchainTxHash}`} target="_blank" rel="noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs">
                            <span className="font-mono">{tx.blockchainTxHash.substring(0, 10)}...</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Not recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inrTransactions.length === 0 && <div className="text-center py-12 text-gray-500">No transactions recorded yet.</div>}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div><h3 className="font-bold text-lg">{project.name}</h3><div className="flex items-center text-gray-500 text-sm mt-1"><MapPin className="h-3 w-3 mr-1" />{project.location}</div></div>
                  {getStatusBadge(project.status)}
                </div>
                <div className="space-y-4">
                  <div><div className="flex justify-between text-sm mb-1"><span>Funding Progress</span><span className="font-medium">{Math.round((project.fundingReceived / project.fundingGoal) * 100)}%</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(project.fundingReceived / project.fundingGoal) * 100}%` }}></div></div><div className="flex justify-between text-xs text-gray-500 mt-1"><span>{formatCurrency(project.fundingReceived)}</span><span>Goal: {formatCurrency(project.fundingGoal)}</span></div></div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-blue-50 p-3 rounded-lg flex items-center space-x-3"><TrendingUp className="h-5 w-5 text-blue-600" /><div><p className="text-xs text-blue-700">CO2 Reduced</p><p className="font-bold text-blue-900">{project.co2Reduction}g</p></div></div>
                    <div className="bg-purple-50 p-3 rounded-lg flex items-center space-x-3"><Users className="h-5 w-5 text-purple-600" /><div><p className="text-xs text-purple-700">Beneficiaries</p><p className="font-bold text-purple-900">{project.beneficiaries.toLocaleString()}</p></div></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'validators' && (
        <Card>
          <CardHeader><CardTitle>Proof of Stake Validators</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="h-8 w-8 text-purple-600" /></div>
              <h3 className="text-lg font-semibold mb-2">Network Security</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">Validators help secure the Carbon Tax System by verifying transactions and earning CTT rewards for their contribution.</p>
              <div className="flex justify-center space-x-12">
                <div><p className="text-3xl font-bold text-gray-900">{totalStats.totalValidators}</p><p className="text-sm text-gray-600">Active Validators</p></div>
                <div><p className="text-3xl font-bold text-gray-900">100%</p><p className="text-sm text-gray-600">Network Uptime</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
