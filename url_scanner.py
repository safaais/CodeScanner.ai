"""
url_scanner.py — URL scanning module for CodeScanner.ai
Uses requests-based scanning with smart security heuristics.
"""

import time
import logging
import re
from typing import Dict, Any
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from config import settings

logger = logging.getLogger(__name__)


class URLScanner:
    """URL security scanner using requests + smart heuristics."""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        self.suspicious_tlds = [
            'xyz', 'top', 'club', 'work', 'click', 'link',
            'download', 'review', 'stream', 'host', 'ml', 'tk', 'ga', 'cf'
        ]

        self.shortener_domains = [
            'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd',
            'buff.ly', 'short.link', 'cutt.ly', 'rebrand.ly'
        ]

        self.phishing_keywords = [
            'login-verify', 'verify-account', 'secure-login',
            'account-update', 'confirm-identity', 'signin-verify',
            'paypal-secure', 'amazon-login', 'apple-verify'
        ]

        logger.info("✅ URLScanner initialized")

    def scan(self, url: str) -> Dict[str, Any]:
        """Scan a URL for security issues."""
        start_time = time.time()

        # Validate URL
        validation = self._validate_url(url)
        if not validation["valid"]:
            return {
                "success": False,
                "error": validation["error"],
                "error_type": validation["error_type"],
                "scan_time": round(time.time() - start_time, 2),
            }

        clean_url = validation["url"]
        issues = []
        scores = {"overall": 8.0, "security": 8.0, "performance": 8.0, "privacy": 7.5}

        parsed = urlparse(clean_url)
        domain = parsed.netloc.lower()
        tld = domain.split('.')[-1] if '.' in domain else ''

        # 1. Suspicious TLD
        if tld in self.suspicious_tlds:
            issues.append({
                "severity": "medium",
                "category": "suspicious_tld",
                "description": f"Suspicious top-level domain: .{tld}",
                "suggestion": f"Avoid .{tld} domains unless the source is verified"
            })
            scores["security"] -= 2.0
            scores["overall"] -= 2.0

        # 2. Phishing keywords
        for kw in self.phishing_keywords:
            if kw in clean_url.lower():
                issues.append({
                    "severity": "high",
                    "category": "phishing_pattern",
                    "description": f"Phishing keyword in URL: '{kw}'",
                    "suggestion": "Verify this site is legitimate"
                })
                scores["security"] -= 3.0
                scores["overall"] -= 3.0
                break

        # 3. Shortened URL
        if any(s in domain for s in self.shortener_domains):
            issues.append({
                "severity": "medium",
                "category": "shortened_url",
                "description": "Shortened URL - destination is hidden",
                "suggestion": "Expand the URL before visiting"
            })
            scores["security"] -= 1.5
            scores["overall"] -= 1.5

        # 4. HTTPS check
        if not clean_url.startswith("https://"):
            issues.append({
                "severity": "high",
                "category": "tls",
                "description": "Site does not use HTTPS encryption",
                "suggestion": "Only use HTTPS for sensitive data"
            })
            scores["security"] -= 2.5
            scores["overall"] -= 2.5

        # 5. Fetch page
        final_url = clean_url
        status_code = None

        try:
            response = self.session.get(clean_url, timeout=10, allow_redirects=True)
            final_url = response.url
            status_code = response.status_code

            # Security headers
            sec_headers = ['Strict-Transport-Security', 'Content-Security-Policy',
                           'X-Frame-Options', 'X-Content-Type-Options']
            headers_lower = [h.lower() for h in response.headers.keys()]
            missing = [h for h in sec_headers if h.lower() not in headers_lower]

            if len(missing) >= 3:
                issues.append({
                    "severity": "low",
                    "category": "headers",
                    "description": f"Missing {len(missing)} security headers",
                    "suggestion": "Add security headers (HSTS, CSP, X-Frame-Options)"
                })
                scores["security"] -= 0.5

            # Server version disclosure
            server = response.headers.get('Server', '')
            if server and any(v in server.lower() for v in ['apache/', 'nginx/', 'iis/']):
                issues.append({
                    "severity": "low",
                    "category": "information_disclosure",
                    "description": f"Server version exposed: {server}",
                    "suggestion": "Hide server version in response headers"
                })
                scores["security"] -= 0.3

        except requests.exceptions.SSLError as e:
            issues.append({
                "severity": "high",
                "category": "tls",
                "description": f"SSL certificate error: {str(e)[:100]}",
                "suggestion": "Certificate may be invalid or expired"
            })
            scores["security"] -= 3.0
            scores["overall"] -= 3.0

        except requests.exceptions.ConnectionError:
            issues.append({
                "severity": "high",
                "category": "connection",
                "description": "Cannot connect to the site",
                "suggestion": "Site may be down, blocking requests, or the domain does not exist"
            })
            scores["security"] -= 2.0
            scores["overall"] -= 2.0

        except requests.exceptions.Timeout:
            issues.append({
                "severity": "medium",
                "category": "timeout",
                "description": "Site did not respond in time",
                "suggestion": "Site may be slow or blocking requests"
            })
            scores["security"] -= 1.0
            scores["overall"] -= 1.0

        except Exception as e:
            issues.append({
                "severity": "medium",
                "category": "scan_error",
                "description": f"Scan error: {str(e)[:100]}",
                "suggestion": "Try again later"
            })
            scores["security"] -= 1.0
            scores["overall"] -= 1.0

        # Clamp scores
        scores["security"] = max(0.0, round(scores["security"], 1))
        scores["overall"] = max(0.0, round(scores["overall"], 1))

        # Summary
        high_count = sum(1 for i in issues if i["severity"] == "high")
        med_count = sum(1 for i in issues if i["severity"] == "medium")
        low_count = sum(1 for i in issues if i["severity"] == "low")

        if high_count > 0:
            summary = f"⚠️ {high_count} HIGH severity issue(s) on {domain}. Overall: {scores['overall']}/10"
        elif med_count > 0:
            summary = f"⚠️ {med_count} MEDIUM severity issue(s) on {domain}. Overall: {scores['overall']}/10"
        elif low_count > 0:
            summary = f"Minor issues found on {domain}. Overall: {scores['overall']}/10"
        else:
            summary = f"Scan of {domain} completed. Overall: {scores['overall']}/10. Site appears clean."

        # Recommendations
        recommendations = [i["suggestion"] for i in issues[:4]]
        if not recommendations:
            recommendations = ["Site follows good security practices"]

        return {
            "success": True,
            "url": clean_url,
            "final_url": final_url,
            "status_code": status_code,
            "scan_time": round(time.time() - start_time, 2),
            "scores": scores,
            "summary": summary,
            "issues": issues,
            "recommendations": recommendations,
            "vulnerabilities": [],
            "vulnerability_count": 0,
        }

    def _validate_url(self, url: str) -> Dict[str, Any]:
        """Validate URL format and security."""
        if not url or not url.strip():
            return {"valid": False, "error": "URL is empty", "error_type": "validation_error"}

        url = url.strip()
        parsed = urlparse(url)

        if parsed.scheme not in ["http", "https"]:
            return {"valid": False, "error": "URL must start with http:// or https://", "error_type": "invalid_scheme"}

        if not parsed.netloc:
            return {"valid": False, "error": "Invalid URL format", "error_type": "missing_host"}

        hostname = parsed.hostname
        if hostname:
            if hostname in ["localhost", "127.0.0.1", "::1"]:
                return {"valid": False, "error": "Scanning localhost is not allowed", "error_type": "private_ip_blocked"}

            private_patterns = [r'^10\.', r'^172\.(1[6-9]|2[0-9]|3[0-1])\.', r'^192\.168\.']
            for pattern in private_patterns:
                if re.match(pattern, hostname):
                    return {"valid": False, "error": "Scanning private IP addresses is not allowed", "error_type": "private_ip_blocked"}

        return {"valid": True, "url": url}