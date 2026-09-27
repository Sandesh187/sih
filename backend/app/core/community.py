import networkx as nx
import community as community_louvain
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CommunityDetector:
    def __init__(self):
        pass

    def detect_communities(self, graph: nx.Graph, algorithm: str = 'louvain') -> Dict[str, int]:
        """
        Detect communities in the transaction graph using Louvain or Leiden algorithms.
        Returns a dictionary mapping node -> community_id
        """
        if graph.number_of_nodes() == 0:
            return {}
            
        # Convert directed graph to undirected for community detection
        if isinstance(graph, nx.DiGraph):
            undirected_G = graph.to_undirected()
        else:
            undirected_G = graph
            
        try:
            if algorithm == 'louvain':
                # python-louvain module
                partition = community_louvain.best_partition(undirected_G, weight='weight')
                return partition
            else:
                logger.warning(f"Algorithm {algorithm} not supported, falling back to louvain")
                return community_louvain.best_partition(undirected_G, weight='weight')
        except Exception as e:
            logger.error(f"Community detection failed: {e}")
            return {}

    def calculate_modularity(self, graph: nx.Graph, communities: Dict[str, int]) -> float:
        """
        Calculate modularity score of the detected communities.
        A higher modularity score indicates strong community structure.
        """
        if not communities or graph.number_of_nodes() == 0:
            return 0.0
            
        if isinstance(graph, nx.DiGraph):
            undirected_G = graph.to_undirected()
        else:
            undirected_G = graph
            
        try:
            return community_louvain.modularity(communities, undirected_G, weight='weight')
        except Exception as e:
            logger.error(f"Modularity calculation failed: {e}")
            return 0.0

    def find_community(self, partition: Dict[str, int], address: str) -> List[str]:
        """
        Find all members of the community an address belongs to.
        """
        address = address.lower()
        if address not in partition:
            return []
            
        target_community = partition[address]
        members = [node for node, comm_id in partition.items() if comm_id == target_community]
        
        return members
