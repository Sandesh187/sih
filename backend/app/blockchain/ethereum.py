import asyncio
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings

logger = logging.getLogger(__name__)

class EthereumClient:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.etherscan_api_key = settings.ETHERSCAN_API_KEY
        self.alchemy_api_key = settings.ALCHEMY_API_KEY
        self.alchemy_url = f"{settings.ALCHEMY_ETH_RPC_URL}/{self.alchemy_api_key}" if self.alchemy_api_key else "https://eth-mainnet.alchemyapi.io/v2/demo"
        
        # Override semaphore to strictly 1 for free API keys to prevent Max Calls Error
        self.etherscan_semaphore = asyncio.Semaphore(1)
        
    async def _fetch_etherscan(self, params: Dict[str, Any]) -> Dict[str, Any]:
        params["apikey"] = self.etherscan_api_key
        params["chainid"] = "1"
        url = "https://api.etherscan.io/v2/api"
        async with self.etherscan_semaphore:
            try:
                await asyncio.sleep(0.2) # Fast compliant rate limiting (5 req/sec)
                response = await self.client.get(url, params=params, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                if data.get("status") == "0" and data.get("message") != "No transactions found":
                    logger.warning(f"Etherscan API error: {data.get('result')}")
                return data
            except Exception as e:
                logger.error(f"Etherscan request failed: {e}")
                return {"status": "0", "result": []}

    async def _fetch_alchemy(self, method: str, params: list) -> Dict[str, Any]:
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }
        try:
            response = await self.client.post(self.alchemy_url, json=payload, timeout=15.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Alchemy request failed: {e}")
            return {"error": str(e)}

    async def get_transactions(self, address: str, start_block: int = 0, end_block: int = 99999999) -> List[Dict[str, Any]]:
        """Return native, internal, and ERC-20 transfers in one normalized stream."""
        normal, internal, tokens = await asyncio.gather(
            self.get_normal_transactions(address, start_block, end_block),
            self.get_internal_transactions(address),
            self.get_token_transfers(address),
        )
        for tx in normal + internal:
            tx["_asset"] = "ETH"
            tx["_decimals"] = 18
        for tx in tokens:
            tx["_asset"] = tx.get("tokenSymbol") or "ERC-20"
            tx["_decimals"] = int(tx.get("tokenDecimal") or 0)
        return normal + internal + tokens

    async def _fetch_paginated(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        # Fetch first batch of recent transactions (up to 100) for instant real-time tracing
        data = await self._fetch_etherscan({**params, "page": 1, "offset": 100})
        return data.get("result", []) if isinstance(data.get("result"), list) else []

    async def get_normal_transactions(self, address: str, start_block: int = 0, end_block: int = 99999999) -> List[Dict[str, Any]]:
        params = {
            "module": "account",
            "action": "txlist",
            "address": address,
            "startblock": start_block,
            "endblock": end_block,
            "sort": "desc"
        }
        return await self._fetch_paginated(params)

    async def get_internal_transactions(self, address: str) -> List[Dict[str, Any]]:
        params = {
            "module": "account",
            "action": "txlistinternal",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "sort": "desc"
        }
        return await self._fetch_paginated(params)

    async def get_token_transfers(self, address: str) -> List[Dict[str, Any]]:
        params = {
            "module": "account",
            "action": "tokentx",
            "address": address,
            "startblock": 0,
            "endblock": 99999999,
            "sort": "desc"
        }
        return await self._fetch_paginated(params)

    async def get_asset_transfers(self, address: str, category: List[str] = None) -> List[Dict[str, Any]]:
        if not category:
            category = ["external", "internal", "erc20", "erc721", "erc1155"]
        params = [{
            "fromBlock": "0x0",
            "toBlock": "latest",
            "fromAddress": address,
            "category": category
        }]
        data = await self._fetch_alchemy("alchemy_getAssetTransfers", params)
        result = data.get("result", {})
        return result.get("transfers", [])

    async def get_balance(self, address: str) -> float:
        params = [address, "latest"]
        data = await self._fetch_alchemy("eth_getBalance", params)
        result = data.get("result", "0x0")
        try:
            balance_wei = int(result, 16)
            return balance_wei / 10**18
        except (ValueError, TypeError):
            return 0.0
