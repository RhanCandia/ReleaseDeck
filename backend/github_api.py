# Compatibility wrapper forwarding to unified multi-provider engine
from backend.git_providers import (
    GitHubClient,
    GitHubAPIError,
    GitProviderError,
    UnifiedGitClient,
    ParsedRepo,
    parse_repo_spec,
    is_linux_recommended,
    get_ssl_context,
    USER_AGENT,
    LINUX_MATCH_KEYWORDS,
    NON_LINUX_KEYWORDS,
)

__all__ = [
    "GitHubClient",
    "GitHubAPIError",
    "GitProviderError",
    "UnifiedGitClient",
    "ParsedRepo",
    "parse_repo_spec",
    "is_linux_recommended",
    "get_ssl_context",
    "USER_AGENT",
    "LINUX_MATCH_KEYWORDS",
    "NON_LINUX_KEYWORDS",
]
