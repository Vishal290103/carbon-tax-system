import { useState, useEffect } from 'react';
import { web3Service } from '../src/services/web3Service';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Settings, PlusCircle, Landmark, AlertTriangle, RefreshCcw, Leaf } from 'lucide-react';
import { API_BASE_URL } from '../src/config';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const [taxRate, setTaxRate] = useState<number>(5);
  const [newTaxRate, setNewTaxRate] = useState<string>('5');
  const [isUpdatingTax, setIsUpdatingTax] = useState(false);
  
  const [productName, setProductName] = useState('');
  const [productPriceINR, setProductPriceINR] = useState('');
  const [productEmission, setProductEmission] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [projectId, setProjectId] = useState('');
  const [fundAmountINR, setFundAmountINR] = useState('');
  const [isFunding, setIsFunding] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
  const [newProjectType, setNewProjectType] = useState('Solar Energy');
  const [newProjectGoalINR, setNewProjectGoalINR] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Helper to convert INR to ETH for blockchain (1 ETH = 2,00,000 INR)
  const getEthFromINR = (inr: string) => {
    const val = parseFloat(inr);
    if (isNaN(val) || val <= 0) return '0';
    return (val / 200000).toFixed(6);
  };

  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      const contract = web3Service.getContract();
      if (contract) {
        const rate = await contract.carbonTaxRate();
        setTaxRate(Number(rate));
        setNewTaxRate(rate.toString());
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleUpdateTaxRate = async () => {
    const rateValue = parseInt(newTaxRate);
    if (rateValue < 0 || rateValue > 20) {
      toast.error('Tax rate must be between 0% and 20%');
      return;
    }
    setIsUpdatingTax(true);
    try {
      const success = await web3Service.updateTaxRate(rateValue);
      if (success) {
        toast.success('Carbon Tax Rate updated on Blockchain!');
        setTaxRate(rateValue);
      }
    } catch (error) {
      console.error('Tax update error:', error);
    } finally {
      setIsUpdatingTax(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productName || !productPriceINR || !productEmission) {
      toast.error('Please fill all product fields');
      return;
    }
    
    const ethPrice = getEthFromINR(productPriceINR);
    if (parseFloat(ethPrice) <= 0 || parseInt(productEmission) < 0) {
      toast.error('Price must be greater than zero and Emission cannot be negative');
      return;
    }

    setIsAddingProduct(true);
    try {
      // 1. First register on the Blockchain
      const success = await web3Service.addProduct(productName, ethPrice, parseInt(productEmission));
      
      if (success) {
        // 2. Then save to the Backend Database (Render) so it shows on the Home Page
        try {
          const response = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: productName,
              price: parseFloat(productPriceINR),
              tax: parseFloat(productPriceINR) * (taxRate / 100),
              category: 'General',
              manufacturer: web3Service.getUserAddress(),
              image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop'
            }),
          });
          
          if (response.ok) {
            toast.success(`'${productName}' is now LIVE on the Home Page and Blockchain!`);
          } else {
            toast.error('Registered on blockchain, but failed to sync to home page. Please refresh.');
          }
        } catch (dbError) {
          console.error('Database sync error:', dbError);
        }

        setProductName('');
        setProductPriceINR('');
        setProductEmission('');
      }
    } catch (error) {
      console.error('Add product error:', error);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleFundProject = async () => {
    if (!projectId || !fundAmountINR) {
      toast.error('Please provide project ID and amount');
      return;
    }
    
    const ethAmount = getEthFromINR(fundAmountINR);
    if (parseInt(projectId) <= 0 || parseFloat(ethAmount) <= 0) {
      toast.error('Valid Project ID and Amount required');
      return;
    }

    setIsFunding(true);
    try {
      // 1. Fund on Blockchain
      const success = await web3Service.fundGreenProject(parseInt(projectId), ethAmount);
      
      if (success) {
        // 2. Sync progress to Backend so it shows in Transparency Portal
        try {
          const projectResponse = await fetch(`${API_BASE_URL}/api/projects`);
          const projects = await projectResponse.json();
          const project = projects.find((p: any) => p.id === parseInt(projectId));

          if (project) {
            const currentFunding = (project.cost * (project.progress || 0)) / 100;
            const newFunding = currentFunding + parseFloat(fundAmountINR);
            const newProgress = Math.min(100, Math.round((newFunding / project.cost) * 100));

            await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...project, progress: newProgress }),
            });
            
            toast.success(`₹${fundAmountINR} allocated! Project progress is now ${newProgress}%.`);
            window.dispatchEvent(new CustomEvent('transactionCompleted'));
          }
        } catch (syncError) {
          console.error('Database sync error:', syncError);
        }

        setProjectId('');
        setFundAmountINR('');
      }
    } catch (error) {
      console.error('Funding error:', error);
    } finally {
      setIsFunding(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectLocation || !newProjectGoalINR) {
      toast.error('Please fill all project fields');
      return;
    }

    const ethGoal = getEthFromINR(newProjectGoalINR);
    setIsCreatingProject(true);

    try {
      // 1. Create on Blockchain
      const success = await web3Service.createGreenProject(
        newProjectName,
        newProjectLocation,
        newProjectType,
        ethGoal,
        parseInt(newProjectGoalINR) / 100
      );

      if (success) {
        // 2. Sync to Backend
        await fetch(`${API_BASE_URL}/api/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newProjectName,
            type: newProjectType,
            cost: parseFloat(newProjectGoalINR),
            description: `A new ${newProjectType} initiative located in ${newProjectLocation}.`,
            progress: 0,
            location: newProjectLocation,
            image: newProjectType.includes('Solar') 
              ? 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=2070'
              : 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2026'
          }),
        });

        toast.success(`'${newProjectName}' created on Blockchain and Transparency Portal!`);
        setNewProjectName('');
        setNewProjectLocation('');
        setNewProjectGoalINR('');
      }
    } catch (error) {
      console.error('Project creation error:', error);
    } finally {
      setIsCreatingProject(false);
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
        <Card className="border-l-4 border-l-indigo-600 shadow-lg">
          <CardHeader><CardTitle className="flex items-center space-x-2"><Settings className="h-5 w-5" /><span>Policy Management</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-700 font-medium">Global Carbon Tax Rate</p>
              <p className="text-3xl font-bold text-indigo-900">{taxRate}%</p>
            </div>
            <div className="flex space-x-2">
              <input type="number" min="0" max="20" value={newTaxRate} onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) setNewTaxRate(val);
              }} className="flex-1 px-4 py-2 border rounded-lg outline-none" />
              <Button onClick={handleUpdateTaxRate} disabled={isUpdatingTax}>{isUpdatingTax ? 'Updating...' : 'Set Rate'}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Fund Allocation */}
        <Card className="border-l-4 border-l-green-600 shadow-lg">
          <CardHeader><CardTitle className="flex items-center space-x-2"><RefreshCcw className="h-5 w-5 text-green-600" /><span>Fund Allocation</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input type="number" min="1" placeholder="Project ID (e.g. 1)" value={projectId} onChange={(e) => {
              const val = e.target.value;
              if (val === '' || parseInt(val) >= 0) setProjectId(val);
            }} className="w-full px-4 py-2 border rounded-lg outline-none" />
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input type="number" min="1" placeholder="Amount (INR)" value={fundAmountINR} onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseFloat(val) >= 0) setFundAmountINR(val);
              }} className="w-full pl-8 pr-4 py-2 border rounded-lg outline-none" />
            </div>
            {fundAmountINR && <p className="text-xs text-green-600 font-medium">Blockchain equivalent: <b>{getEthFromINR(fundAmountINR)} ETH</b></p>}
            <Button onClick={handleFundProject} disabled={isFunding} className="w-full bg-green-600 hover:bg-green-700">{isFunding ? 'Processing...' : 'Authorize Funding'}</Button>
          </CardContent>
        </Card>

        {/* Create Project */}
        <Card className="border-l-4 border-l-emerald-600 shadow-lg">
          <CardHeader><CardTitle className="flex items-center space-x-2"><PlusCircle className="h-5 w-5 text-emerald-600" /><span>Create Green Project</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Project Name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" />
            <input type="text" placeholder="Location" value={newProjectLocation} onChange={(e) => setNewProjectLocation(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" />
            <select value={newProjectType} onChange={(e) => setNewProjectType(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none">
              <option value="Solar Energy">Solar Energy</option>
              <option value="Reforestation">Reforestation</option>
              <option value="Wind Power">Wind Power</option>
            </select>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input type="number" min="1" placeholder="Funding Goal (INR)" value={newProjectGoalINR} onChange={(e) => setNewProjectGoalINR(e.target.value)} className="w-full pl-8 pr-4 py-2 border rounded-lg outline-none" />
            </div>
            <Button onClick={handleCreateProject} disabled={isCreatingProject} className="w-full bg-emerald-600">{isCreatingProject ? 'Creating...' : 'Create on Blockchain & Web'}</Button>
          </CardContent>
        </Card>

        {/* Add Product */}
        <Card className="border-l-4 border-l-blue-600 shadow-lg">
          <CardHeader><CardTitle className="flex items-center space-x-2"><Leaf className="h-5 w-5 text-blue-600" /><span>Register Product</span></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" />
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>
              <input type="number" min="1" placeholder="Price (INR)" value={productPriceINR} onChange={(e) => setProductPriceINR(e.target.value)} className="w-full pl-8 pr-4 py-2 border rounded-lg outline-none" />
            </div>
            <input type="number" min="0" placeholder="CO2 Emission (g)" value={productEmission} onChange={(e) => setProductEmission(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none" />
            <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full bg-blue-600">{isAddingProduct ? 'Registering...' : 'Register as Manufacturer'}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm text-amber-800 font-bold">Government Authorization Required</p>
          <p className="text-xs text-amber-700">Only the authorized government cryptographic key can execute these commands.</p>
        </div>
      </div>
    </div>
  );
}
