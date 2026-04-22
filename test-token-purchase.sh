#!/bin/bash

# Test script for token purchase functionality
BASE_URL="http://localhost:8081/api/blockchain"

echo "Testing Carbon Tax System Token Purchase Functionality"
echo "===================================================="
echo

# Test 1: Get exchange rate
echo "1. Testing exchange rate endpoint..."
curl -s -X GET "${BASE_URL}/tokens/exchange-rate" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/tokens/exchange-rate")"
echo
echo

# Test 2: Estimate token purchase
echo "2. Testing token purchase estimation..."
curl -s -X POST "${BASE_URL}/tokens/estimate" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/estimate" -H "Content-Type: application/json" -d '{"tokenAmount": 1000}')"
echo
echo

# Test 3: Test token purchase (valid request)
echo "3. Testing token purchase (valid request)..."
curl -s -X POST "${BASE_URL}/tokens/buy" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000, "ethAmount": 1.0}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/buy" -H "Content-Type: application/json" -d '{"tokenAmount": 1000, "ethAmount": 1.0}')"
echo
echo

# Test 4: Test token purchase with invalid amounts (below minimum)
echo "4. Testing token purchase (invalid - below minimum)..."
curl -s -X POST "${BASE_URL}/tokens/buy" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 50, "ethAmount": 0.05}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/buy" -H "Content-Type: application/json" -d '{"tokenAmount": 50, "ethAmount": 0.05}')"
echo
echo

# Test 5: Test token purchase with invalid amounts (above maximum)
echo "5. Testing token purchase (invalid - above maximum)..."
curl -s -X POST "${BASE_URL}/tokens/buy" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 15000, "ethAmount": 15.0}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/buy" -H "Content-Type: application/json" -d '{"tokenAmount": 15000, "ethAmount": 15.0}')"
echo
echo

# Test 6: Test token purchase with wrong exchange rate
echo "6. Testing token purchase (invalid exchange rate)..."
curl -s -X POST "${BASE_URL}/tokens/buy" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000, "ethAmount": 0.5}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/buy" -H "Content-Type: application/json" -d '{"tokenAmount": 1000, "ethAmount": 0.5}')"
echo
echo

# Test 7: Test token purchase with missing data
echo "7. Testing token purchase (missing data)..."
curl -s -X POST "${BASE_URL}/tokens/buy" \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/tokens/buy" -H "Content-Type: application/json" -d '{"tokenAmount": 1000}')"
echo
echo

echo "===================================================="
echo "Token purchase endpoint testing completed!"
echo
echo "Frontend Usage:"
echo "1. Start backend: cd 'major back' && mvn spring-boot:run"
echo "2. Start frontend: cd 'major front' && npm run dev"
echo "3. Open http://localhost:5173 in browser"
echo "4. Go to 'Validator' tab"
echo "5. Click 'Buy CTT with ETH' button"
echo "6. Use the modal to purchase tokens"
echo "===================================================="