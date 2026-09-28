import json
import logging
import re
from datetime import date
from pathlib import Path
from typing import Dict, Any, List
from urllib.parse import urlparse

from app.config import settings

logger = logging.getLogger(__name__)
ETHEREUM_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")
TRON_ADDRESS = re.compile(r"^T[a-zA-Z0-9]{33}$")


def load_verified_ethereum_vasps() -> Dict[str, str]:
    """Load verified Ethereum and Tron VASP labels from the local registry."""
    default_path = Path(__file__).resolve().parents[2] / "data" / "vasp_labels.json"
    path = Path(settings.VASP_LABELS_PATH) if settings.VASP_LABELS_PATH else default_path

    try:
        raw_data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(raw_data, dict):
            records = raw_data.get("labels", [])
        elif isinstance(raw_data, list):
            records = raw_data
        else:
            records = []
    except FileNotFoundError:
        logger.warning("VASP label registry was not found at %s; no labels loaded", path)
        return {}
    except (OSError, json.JSONDecodeError) as error:
        logger.error("Unable to read VASP label registry at %s: %s", path, error)
        return {}

    labels: Dict[str, str] = {}
    for record in records:
        address = str(record.get("address", "")).strip()
        name = str(record.get("vasp_name") or record.get("name") or "").strip()
        chain = str(record.get("chain", "ethereum")).lower()
        source_url = str(record.get("source_url", "https://etherscan.io")).strip()
        verified_at = str(record.get("verified_at", "2026-01-01")).strip()

        # Validate Address
        if chain in {"eth", "ethereum"}:
            if not ETHEREUM_ADDRESS.fullmatch(address):
                logger.debug("Ignoring invalid Ethereum address: %s", address)
                continue
            key = address.lower()
        elif chain in {"trx", "tron"}:
            if not TRON_ADDRESS.fullmatch(address):
                logger.debug("Ignoring invalid Tron address: %s", address)
                continue
            key = address  # Tron Base58Check is case-sensitive
        else:
            continue

        if not name:
            continue

        labels[key] = name

    logger.info("Loaded %d verified VASP labels into memory", len(labels))
    return labels
