from typing import Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Alchemy Config
    ALCHEMY_API_KEY: str = ""
    ALCHEMY_ETH_RPC_URL: str = ""
    
    # Infura Config
    INFURA_API_KEY: str = ""
    INFURA_ETH_RPC_URL: str = ""
    
    # Etherscan Config
    ETHERSCAN_API_KEY: str = ""
    ETHERSCAN_RATE_LIMIT: int = 5 # req per second
    MAX_TRANSFERS_PER_ADDRESS: int = 1000
    ETHERSCAN_PAGE_SIZE: int = 1000
    
    # Tron Config
    TRONGRID_API_KEY: str = ""
    TRONSCAN_API_URL: str = "https://apilist.tronscan.org"
    TRONGRID_RATE_LIMIT: int = 15
    TRONSCAN_PAGE_SIZE: int = 100
    
    # Database Config
    # Removed Neo4j and Clickhouse to streamline SIH prototype deployment

    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    TRACE_RESULT_TTL_SECONDS: int = 86400
    
    # Gemini
    GEMINI_API_KEY: str = ""

    # Provenance-backed VASP labels. An empty value uses backend/data/vasp_labels.json.
    VASP_LABELS_PATH: str = ""
    
    # App Config
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    SECRET_KEY: str = ""
    API_KEY: str = "dev_secret_key_123"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
