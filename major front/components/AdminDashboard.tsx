import { useState, useEffect } from 'react';
import { web3Service } from '../src/services/web3Service';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Settings, PlusCircle, Landmark, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const [taxRate, setTaxRate] = useState<number>(5);
  const [newTaxRate, setNewTaxRate] = useState<string>('5');
  const [isUpdatingTax, setIsUpdatingTax] = useState(false);
  
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productEmission, setProductEmission] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [projectId, setProjectId] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      if (web3Service.getContract()) {
        const rate = await web3Service.getContract().carbonTaxRate();
        setTaxRate(Number(rate));
        setNewTaxRate(rate.toString());
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleUpdateTaxRate = async () => {
    setIsUpdatingTax(true);
    try {
      const success = await web3Service.updateTaxRate(parseInt(newTaxRate));
      if (success) {
        toast.success('Carbon Tax Rate updated on Blockchain!');
        setTaxRate(parseInt(newTaxRate));
      }
    } catch (error) {
      console.error('Tax update error:', error);
    } finally {
      setIsUpdatingTax(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productName || !productPrice || !productEmission) {
      toast.error('Please fill all product fields');
      return;
    }
    setIsAddingProduct(true);
    try {
      const success = await web3Service.addProduct(productName, productPrice, parseInt(productEmission));
      if (success) {
        toast.success('New product registered on Blockchain!');
        setProductName('');
        setProductPrice('');
        setProductEmission('');
      }
    } catch (error) {
      console.error('Add product error:', error);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleFundProject = async () => {
    if (!projectId || !fundAmount) {
      toast.error('Please provide project ID and amount');
      return;
    }
    setIsFunding(true);
    try {
      const success = await web3Service.fundGreenProject(parseInt(projectId), fundAmount);
      if (success) {
        toast.success('Funds successfully allocated to Green Project!');
        setProjectId('');
        setFundAmount('');
      }
    } catch (error) {
      console.error('Funding error:', error);
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Landmark className="h-8 w-8 text-indigo-700" />
        <h2 className="text-3xl font-bold text-gray-900">Government Control Panel</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tax Rate Control */}
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Climate Policy Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-700 font-medium">Current Global Tax Rate</p>
                <p className="text-3xl font-bold text-indigo-900">{taxRate}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Tax Rate (%)</label>
                <div className="flex space-x-2">
                  <input 
                    type="number" 
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <Button onClick={handleUpdateTaxRate} disabled={isUpdatingTax}>
                    {isUpdatingTax ? 'Updating...' : 'Set Rate'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                * Updating this will affect all future transactions across the network.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fund Allocation */}
        <Card className="border-l-4 border-l-green-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCcw className="h-5 w-5 text-green-600" />
              <span>Project Fund Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Allocate (ETH)</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="e.g. 0.5"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
              <Button 
                onClick={handleFundProject} 
                disabled={isFunding}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isFunding ? 'Processing...' : 'Authorize Funding'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Product */}
        <Card className="md:col-span-2 border-l-4 border-l-blue-600">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlusCircle className="h-5 w-5 text-blue-600" />
              <span>Register Verified Manufacturer Product</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Electric Vehicle X"
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (ETH)</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="e.g. 0.2"
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carbon Emission (g CO2)</label>
                <input 
                  type="number" 
                  value={productEmission}
                  onChange={(e) => setProductEmission(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-4 py-2 border rounded-lg outline-none"
                />
              </div>
            </div>
            <Button 
              onClick={handleAddProduct} 
              disabled={isAddingProduct}
              className="mt-6 w-full md:w-auto px-12"
            >
              {isAddingProduct ? 'Registering...' : 'Register Product on Blockchain'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800 font-bold">Government Authorization Required</p>
          <p className="text-xs text-amber-700">These actions are restricted. Only the authorized government cryptographic key can execute these commands on the Ethereum network.</p>
        </div>
      </div>
    </div>
  );
}
