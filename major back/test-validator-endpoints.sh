#!/bin/bash

# Test script for validator endpoints
BASE_URL="http://localhost:8081/api/blockchain"

echo "Testing Carbon Tax System Validator Endpoints"
echo "=============================================="
echo

# Test 1: Check blockchain status
echo "1. Testing blockchain status..."
curl -s -X GET "${BASE_URL}/status" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/status")"
echo
echo

# Test 2: Get system stats (includes validator count)
echo "2. Testing system statistics..."
curl -s -X GET "${BASE_URL}/stats" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/stats")"
echo
echo

# Test 3: Get all validators
echo "3. Testing get all validators..."
curl -s -X GET "${BASE_URL}/validators" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/validators")"
echo
echo

# Test 4: Get validator statistics
echo "4. Testing validator statistics..."
curl -s -X GET "${BASE_URL}/validators/stats" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/validators/stats")"
echo
echo

# Test 5: Test staking with valid data
echo "5. Testing staking tokens (valid request)..."
curl -s -X POST "${BASE_URL}/stake" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/stake" -H "Content-Type: application/json" -d '{"amount": 1500}')"
echo
echo

# Test 6: Test staking with invalid data (less than minimum)
echo "6. Testing staking tokens (invalid - below minimum)..."
curl -s -X POST "${BASE_URL}/stake" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/stake" -H "Content-Type: application/json" -d '{"amount": 500}')"
echo
echo

# Test 7: Test staking with missing data
echo "7. Testing staking tokens (invalid - missing amount)..."
curl -s -X POST "${BASE_URL}/stake" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/stake" -H "Content-Type: application/json" -d '{}')"
echo
echo

# Test 8: Test validator info with valid address
echo "8. Testing get validator info (valid address)..."
TEST_ADDRESS="0x1234567890123456789012345678901234567890"
curl -s -X GET "${BASE_URL}/validators/${TEST_ADDRESS}" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/validators/${TEST_ADDRESS}")"
echo
echo

# Test 9: Test validator info with invalid address
echo "9. Testing get validator info (invalid address)..."
curl -s -X GET "${BASE_URL}/validators/invalid-address" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/validators/invalid-address")"
echo
echo

# Test 10: Test validator rewards
echo "10. Testing get validator rewards..."
curl -s -X GET "${BASE_URL}/validators/${TEST_ADDRESS}/rewards" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X GET "${BASE_URL}/validators/${TEST_ADDRESS}/rewards")"
echo
echo

# Test 11: Test claim rewards
echo "11. Testing claim rewards..."
curl -s -X POST "${BASE_URL}/claim-rewards" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/claim-rewards")"
echo
echo

# Test 12: Test unstake tokens
echo "12. Testing unstake tokens..."
curl -s -X POST "${BASE_URL}/unstake" | jq '.' 2>/dev/null || echo "Response: $(curl -s -X POST "${BASE_URL}/unstake")"
echo
echo

echo "=============================================="
echo "Validator endpoint testing completed!"
echo "=============================================="