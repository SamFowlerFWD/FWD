#!/bin/bash

# Test script for FWD AI Playground demos
# Run this to ensure all playground features are working

echo "🧪 Testing FWD AI Playground APIs..."
echo "====================================="

BASE_URL="http://localhost:4321/api/playground"
ERRORS=0
TESTS=0

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local data=$2
    local description=$3
    
    TESTS=$((TESTS + 1))
    echo -n "Testing $description... "
    
    response=$(curl -s -X POST "$BASE_URL/$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" | jq -r '.content // .message // .error // "FAILED"')
    
    if [[ "$response" == "FAILED" ]] || [[ "$response" == *"error"* ]]; then
        echo "❌ FAILED"
        echo "  Response: $response"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ PASSED"
    fi
}

# Test Chat API (Retail Support)
test_api "chat" \
    '{"message": "Where is my order #12345?", "conversationHistory": []}' \
    "Chat API - Order tracking"

test_api "chat" \
    '{"message": "I want a refund", "conversationHistory": []}' \
    "Chat API - Refund request"

test_api "chat" \
    '{"message": "Do you have this in stock?", "conversationHistory": []}' \
    "Chat API - Stock inquiry"

# Test Product API
test_api "product" \
    '{"productName": "Wireless Headphones", "category": "electronics"}' \
    "Product API - Electronics"

test_api "product" \
    '{"productName": "Summer Dress", "category": "clothing"}' \
    "Product API - Clothing"

test_api "product" \
    '{"productName": "Face Moisturizer", "category": "beauty"}' \
    "Product API - Beauty"

# Test Email API
test_api "email" \
    '{"context": "Customer asking about order status", "tone": "professional"}' \
    "Email API - Order status"

test_api "email" \
    '{"context": "Apologizing for delay", "tone": "friendly"}' \
    "Email API - Apology"

test_api "email" \
    '{"context": "Confirming refund processed", "tone": "professional"}' \
    "Email API - Refund confirmation"

# Test Analyze API (Business Assistant)
test_api "analyze" \
    '{"problem": "I run a hair salon", "conversationHistory": []}' \
    "Analyze API - Hair salon"

# Summary
echo "====================================="
echo "📊 Test Results:"
echo "  Total tests: $TESTS"
echo "  Passed: $((TESTS - ERRORS))"
echo "  Failed: $ERRORS"

if [ $ERRORS -eq 0 ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "⚠️  Some tests failed. Please check the errors above."
    exit 1
fi