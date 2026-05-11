#!/bin/bash
set -e

API_ID="nj6nmdc5ge"
REGION="us-east-2"
RESOURCES=("dflz5g" "hdtmdq")

for RES_ID in "${RESOURCES[@]}"; do
  echo "=== Processing resource $RES_ID ==="

  echo "Adding OPTIONS method..."
  aws apigateway put-method \
    --rest-api-id "$API_ID" \
    --resource-id "$RES_ID" \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region "$REGION"

  echo "Adding MOCK integration..."
  aws apigateway put-integration \
    --rest-api-id "$API_ID" \
    --resource-id "$RES_ID" \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
    --region "$REGION"

  echo "Adding method response..."
  aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RES_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Origin": false
    }' \
    --region "$REGION"

  echo "Adding integration response..."
  aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RES_ID" \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'",
      "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,OPTIONS'"'"'",
      "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'"
    }' \
    --region "$REGION"

  echo "Done with $RES_ID"
  echo ""
done

echo "=== Deploying to prod stage ==="
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name prod \
  --region "$REGION"

echo "=== Done ==="
