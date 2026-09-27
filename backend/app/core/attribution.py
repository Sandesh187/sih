import json
import logging
import re
from datetime import date
from pathlib import Path
from typing import Dict
from urllib.parse import urlparse

from app.config import settings

logger = logging.getLogger(__name__)
ETHEREUM_ADDRESS = re.compile(r"^0x[a-fA-F0-9]{40}$")


def load_verified_ethereum_vasps() -> Dict[str, str]:
    """Load only provenance-backed Ethereum VASP labels from the local registry."""
    default_path = Path(__file__).resolve().parents[2] / "data" / "vasp_labels.json"
    path = Path(settings.VASP_LABELS_PATH) if settings.VASP_LABELS_PATH else default_path

    try:
        records = json.loads(path.read_text(encoding="utf-8")).get("labels", [])
    except FileNotFoundError:
        logger.warning("VASP label registry was not found at %s; no labels loaded", path)
        return {}
    except (OSError, json.JSONDecodeError) as error:
        logger.error("Unable to read VASP label registry at %s: %s", path, error)
        return {}

    labels: Dict[str, str] = {}
    for record in records:
        address = str(record.get("address", ""))
        name = str(record.get("vasp_name", "")).strip()
        source_url = str(record.get("source_url", "")).strip()
        verified_at = str(record.get("verified_at", "")).strip()
        chain = str(record.get("chain", "")).lower()

        if chain not in {"eth", "ethereum"} or not ETHEREUM_ADDRESS.fullmatch(address):
            logger.warning("Ignoring invalid VASP label address: %r", address)
            continue
        if not name or not source_url or not verified_at:
            logger.warning("Ignoring VASP label without provenance for %s", address)
            continue
        if urlparse(source_url).scheme not in {"http", "https"} or not urlparse(source_url).netloc:
            logger.warning("Ignoring VASP label with invalid source URL for %s", address)
            continue
        try:
            date.fromisoformat(verified_at)
        except ValueError:
            logger.warning("Ignoring VASP label with invalid verification date for %s", address)
            continue
        labels[address.lower()] = name

    return labels
