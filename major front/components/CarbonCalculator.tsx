import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { 
  Calculator, 
  Car, 
  Zap, 
  Flame, 
  Leaf,
  TreePine,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface CarbonFootprint {
  transportation: number;
  electricity: number;
  heating: number;
  total: number;
  carbonTax: number;
  offsetCost: number;
}

export function CarbonCalculator() {
  const [inputs, setInputs] = useState({
    carMiles: '',
    electricityKwh: '',
    gasTherm: '',
    flights: ''
  });
  
  const [result, setResult] = useState<CarbonFootprint | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Carbon emission factors (kg CO2 per unit)
  const emissionFactors = {
    carMilesPerGallon: 8.89, // kg CO2 per gallon
    averageMpg: 25, // miles per gallon
    electricityPerKwh: 0.4, // kg CO2 per kWh
    gasPerTherm: 5.3, // kg CO2 per therm
    flightPerMile: 0.24 // kg CO2 per mile
  };

  // Carbon tax rates ($ per kg CO2)
  const carbonTaxRate = 0.05; // $0.05 per kg CO2
  const offsetCostRate = 0.02; // $0.02 per kg CO2 for offset projects

  const handleInputChange = (field: keyof typeof inputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const calculateFootprint = () => {
    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const carMiles = parseFloat(inputs.carMiles) || 0;
        const electricityKwh = parseFloat(inputs.electricityKwh) || 0;
        const gasTherm = parseFloat(inputs.gasTherm) || 0;
        const flights = parseFloat(inputs.flights) || 0;

        // Calculate emissions for each category (in kg CO2)
        const transportationCO2 = (carMiles / emissionFactors.averageMpg) * emissionFactors.carMilesPerGallon 
                                  + (flights * 500 * emissionFactors.flightPerMile); // Assume 500 miles per flight
        const electricityCO2 = electricityKwh * emissionFactors.electricityPerKwh;
        const heatingCO2 = gasTherm * emissionFactors.gasPerTherm;

        const totalCO2 = transportationCO2 + electricityCO2 + heatingCO2;
        const carbonTax = totalCO2 * carbonTaxRate;
        const offsetCost = totalCO2 * offsetCostRate;

        const footprint: CarbonFootprint = {
          transportation: transportationCO2,
          electricity: electricityCO2,
          heating: heatingCO2,
          total: totalCO2,
          carbonTax: carbonTax,
          offsetCost: offsetCost
        };

        setResult(footprint);
        toast.success('Carbon footprint calculated successfully!');
      } catch (error) {
        toast.error('Error calculating carbon footprint');
      } finally {
        setIsCalculating(false);
      }
    }, 1000);
  };

  const resetCalculator = () => {
    setInputs({
      carMiles: '',
      electricityKwh: '',
      gasTherm: '',
      flights: ''
    });
    setResult(null);
  };

  const getEmissionLevel = (totalCO2: number) => {
    if (totalCO2 < 1000) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (totalCO2 < 3000) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Carbon Footprint Calculator</h2>
        <p className="text-xl text-gray-600">
          Calculate your annual carbon emissions and understand your environmental impact
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-6 w-6" />
              <span>Annual Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Transportation */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Car className="h-4 w-4" />
                  <span>Transportation</span>
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Miles driven per year</label>
                    <Input
                      type="number"
                      placeholder="12000"
                      value={inputs.carMiles}
                      onChange={(e) => handleInputChange('carMiles', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Number of flights per year</label>
                    <Input
                      type="number"
                      placeholder="4"
                      value={inputs.flights}
                      onChange={(e) => handleInputChange('flights', e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Electricity */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Zap className="h-4 w-4" />
                  <span>Electricity Usage</span>
                </label>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">kWh per year</label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={inputs.electricityKwh}
                    onChange={(e) => handleInputChange('electricityKwh', e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Heating */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Flame className="h-4 w-4" />
                  <span>Natural Gas Heating</span>
                </label>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Therms per year</label>
                  <Input
                    type="number"
                    placeholder="800"
                    value={inputs.gasTherm}
                    onChange={(e) => handleInputChange('gasTherm', e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button 
                  onClick={calculateFootprint}
                  disabled={isCalculating}
                  className="flex-1"
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Footprint'}
                </Button>
                <Button 
                  onClick={resetCalculator}
                  variant="secondary"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Leaf className="h-6 w-6" />
                <span>Your Carbon Footprint</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Total Emissions */}
                <div className={`p-4 rounded-lg ${getEmissionLevel(result.total).bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold">Total Annual Emissions</span>
                    <span className={`text-sm px-2 py-1 rounded ${getEmissionLevel(result.total).color} bg-white`}>
                      {getEmissionLevel(result.total).level}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(result.total)} kg CO₂
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Equivalent to {formatNumber(result.total / 1000)} metric tons
                  </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Emissions Breakdown</h4>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Transportation</span>
                    </div>
                    <span className="font-medium">{formatNumber(result.transportation)} kg CO₂</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Electricity</span>
                    </div>
                    <span className="font-medium">{formatNumber(result.electricity)} kg CO₂</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center space-x-2">
                      <Flame className="h-4 w-4 text-red-600" />
                      <span className="text-sm">Heating</span>
                    </div>
                    <span className="font-medium">{formatNumber(result.heating)} kg CO₂</span>
                  </div>
                </div>

                {/* Financial Impact */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Financial Impact</h4>
                  
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Carbon Tax</span>
                    </div>
                    <p className="text-xl font-bold text-red-600">
                      ${formatNumber(result.carbonTax)}
                    </p>
                    <p className="text-xs text-red-600">Annual tax based on emissions</p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <TreePine className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Offset Cost</span>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      ${formatNumber(result.offsetCost)}
                    </p>
                    <p className="text-xs text-green-600">Cost to offset through green projects</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Consider electric or hybrid vehicles</li>
                    <li>• Switch to renewable energy sources</li>
                    <li>• Improve home insulation</li>
                    <li>• Offset emissions through verified projects</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}