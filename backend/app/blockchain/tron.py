import asyncio
import httpx
import logging
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class TronClient:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.trongrid_api_key = settings.TRONGRID_API_KEY
        self.tronscan_url = settings.TRONSCAN_API_URL
        self.trongrid_url = "https://api.trongrid.io"
        
        # Rate limiting
        self.semaphore = asyncio.Semaphore(settings.TRONGRID_RATE_LIMIT)
        
    async def _fetch_tronscan(self, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.tronscan_url}/{endpoint}"
        try:
            response = await self.client.get(url, params=params, timeout=15.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"TronScan request failed: {e}")
            return {}

    async def _fetch_trongrid(self, endpoint: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        url = f"{self.trongrid_url}/{endpoint}"
        headers = {}
        if self.trongrid_api_key:
            headers["TRON-PRO-API-KEY"] = self.trongrid_api_key
            
        async with self.semaphore:
            try:
                response = await self.client.get(url, params=params, headers=headers, timeout=15.0)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"TronGrid request failed: {e}")
                return {}

    async def get_transactions(self, address: str) -> List[Dict[str, Any]]:
        native, trc20 = await asyncio.gather(
            self.get_native_transactions(address), self.get_trc20_transfers(address)
        )
        for tx in native:
            tx["_asset"] = "TRX"
            tx["_decimals"] = 6
        normalized_tokens = []
        for tx in trc20:
            token = tx.get("tokenInfo", {})
            normalized_tokens.append({
                "ownerAddress": tx.get("from_address", ""), "toAddress": tx.get("to_address", ""),
                "amount": tx.get("quant", tx.get("amount", 0)),
                "hash": tx.get("transaction_id", tx.get("hash", "")),
                "timestamp": tx.get("block_ts", tx.get("timestamp", 0)),
                "_asset": token.get("tokenAbbr") or "TRC-20",
                "_decimals": int(token.get("tokenDecimal") or 0),
            })
        return native + normalized_tokens

    async def _fetch_paginated(self, endpoint: str, params: Dict[str, Any], key: str) -> List[Dict[str, Any]]:
        records: List[Dict[str, Any]] = []
        start = 0
        while len(records) < settings.MAX_TRANSFERS_PER_ADDRESS:
            data = await self._fetch_tronscan(endpoint, {**params, "start": start, "limit": settings.TRONSCAN_PAGE_SIZE})
            batch = data.get(key, []) if isinstance(data.get(key), list) else []
            records.extend(batch)
            if len(batch) < settings.TRONSCAN_PAGE_SIZE:
                break
            start += len(batch)
        return records[:settings.MAX_TRANSFERS_PER_ADDRESS]

    async def get_native_transactions(self, address: str) -> List[Dict[str, Any]]:
        return await self._fetch_paginated("api/transaction", {"address": address}, "data")

    async def get_trc20_transfers(self, address: str) -> List[Dict[str, Any]]:
        return await self._fetch_paginated("api/token_trc20/transfers", {"relatedAddress": address}, "token_transfers")

    async def get_account_info(self, address: str) -> Dict[str, Any]:
        data = await self._fetch_trongrid(f"v1/accounts/{address}")
        accounts = data.get("data", [])
        if accounts:
            return accounts[0]
        return {}

    async def get_contract_events(self, address: str) -> List[Dict[str, Any]]:
        params = {
            "limit": 100
        }
        data = await self._fetch_trongrid(f"v1/contracts/{address}/events", params)
        return data.get("data", [])
