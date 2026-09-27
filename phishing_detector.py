"""
phishing_detector.py - AI-powered phishing detection with rule-based and ML heuristics
"""

import re
import logging
from typing import Dict, Any, List, Tuple, Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


class PhishingDetector:
    """Detect phishing URLs and content using comprehensive rule-based heuristics."""

    def __init__(self):
        self.suspicious_keywords = [
            "verify", "account", "update", "confirm", "login", "signin",
            "secure", "banking", "paypal", "appleid", "microsoft",
            "password", "credential", "statement", "alert", "suspended",
            "unlock", "restore", "validate", "authenticate", "security",
            "blocked", "suspicious", "unusual", "activity", "immediately",
            "urgent", "limited", "access", "information"
        ]

        self.suspicious_tlds = [
            '.tk', '.ml', '.ga', '.cf', '.xyz', '.top', '.club',
            '.live', '.click', '.download', '.stream', '.gq', '.bid'
        ]

        self.brands = [
            "paypal", "apple", "microsoft", "google", "amazon",
            "facebook", "instagram", "linkedin", "netflix", "spotify",
            "chase", "bankofamerica", "wellsfargo", "citibank",
            "whatsapp", "telegram", "discord", "twitter", "tiktok",
            "dropbox", "adobe", "yahoo", "outlook", "office365"
        ]

    def _normalize_for_brand_check(self, text: str) -> str:
        """Normalize common typosquatting characters (0→o, 1→l, etc.)."""
        replacements = {
            '0': 'o', '1': 'l', '3': 'e', '5': 's',
            '4': 'a', '@': 'a', '$': 's', '7': 't',
        }
        normalized = text.lower()
        for fake, real in replacements.items():
            normalized = normalized.replace(fake, real)
        return normalized

    def detect(self, url: Optional[str] = None, content: Optional[str] = None) -> Dict[str, Any]:
        """Main detection function."""
        indicators = []
        score = 0
        brand_detected = None
        warnings = []

        if url:
            url_score, url_indicators, brand, url_warnings = self._analyze_url(url)
            score += url_score
            indicators.extend(url_indicators)
            warnings.extend(url_warnings)
            brand_detected = brand

        if content:
            content_score, content_indicators, content_warnings = self._analyze_content(content)
            score += content_score
            indicators.extend(content_indicators)
            warnings.extend(content_warnings)

        total_score = min(100, score)

        # Determine risk level
        if total_score >= 75:
            risk_level = "critical"
            is_phishing = True
            suggested_action = "block"
            confidence = min(0.99, total_score / 100)
        elif total_score >= 55:
            risk_level = "high"
            is_phishing = True
            suggested_action = "block"
            confidence = min(0.95, total_score / 100)
        elif total_score >= 35:
            risk_level = "medium"
            is_phishing = True
            suggested_action = "warn"
            confidence = min(0.85, total_score / 100)
        elif total_score >= 15:
            risk_level = "low"
            is_phishing = False
            suggested_action = "warn"
            confidence = min(0.5, total_score / 100)
        else:
            risk_level = "safe"
            is_phishing = False
            suggested_action = "allow"
            confidence = 0.05 if total_score == 0 else total_score / 100

        indicators = list(dict.fromkeys(indicators))
        warnings = list(dict.fromkeys(warnings))

        return {
            "is_phishing": is_phishing,
            "confidence": round(confidence, 2),
            "risk_level": risk_level,
            "risk_score": total_score,
            "indicators": indicators[:15],
            "warnings": warnings[:10],
            "brand_spoofed": brand_detected,
            "explanation": self._generate_explanation(is_phishing, risk_level, indicators, brand_detected),
            "suggested_action": suggested_action,
            "detection_method": "heuristic"
        }

    def _analyze_url(self, url: str) -> Tuple[float, List[str], Optional[str], List[str]]:
        """Analyze URL for phishing indicators."""
        score = 0
        indicators = []
        warnings = []
        brand_detected = None

        try:
            parsed = urlparse(url)
            hostname = parsed.hostname or ""

            # ── HTTPS check ──
            if parsed.scheme != "https":
                score += 10
                indicators.append("No HTTPS encryption — data sent insecurely")

            # ── Suspicious TLD ──
            for tld in self.suspicious_tlds:
                if hostname.endswith(tld):
                    score += 35
                    indicators.append(f"Suspicious TLD: {tld} (heavily abused by phishers)")
                    warnings.append(f".{tld} domains are commonly used for phishing")
                    break

            # ── Brand impersonation with TYPOSQUATTING ──
            normalized_hostname = self._normalize_for_brand_check(hostname)
            hostname_lower = hostname.lower()

            typosquatting_detected = False
            for brand in self.brands:
                if brand in hostname_lower:
                    brand_detected = brand
                    break
                if brand in normalized_hostname:
                    brand_detected = brand
                    typosquatting_detected = True
                    break

            if brand_detected:
                domain_parts = hostname_lower.split('.')
                if len(domain_parts) >= 2:
                    main_domain = domain_parts[-2] if len(domain_parts) > 2 else domain_parts[0]
                    main_domain_normalized = self._normalize_for_brand_check(main_domain)

                    is_official = (brand_detected == main_domain_normalized)

                    if not is_official:
                        score += 50
                        indicators.append(f"Brand impersonation: '{brand_detected}' in domain but not official")
                        warnings.append(f"This domain impersonates {brand_detected}")

                        if typosquatting_detected:
                            score += 20
                            indicators.append(f"Typosquatting: '{hostname}' mimics '{brand_detected}' using lookalike characters")
                            warnings.append(f"Domain uses character substitution (0→o, 1→l) to impersonate {brand_detected}")
                    else:
                        if any(kw in url.lower() for kw in ["verify", "login", "secure", "update", "confirm"]):
                            score += 25
                            indicators.append(f"'{brand_detected}' domain with phishing keyword")

            # ── Numbers in domain + brand = typosquatting ──
            if re.search(r'[0-9]', hostname) and any(b in normalized_hostname for b in self.brands):
                score += 15
                indicators.append("Numbers in domain with brand name — possible typosquatting")

            # ── Excessive subdomains ──
            subdomain_count = hostname.count('.')
            if subdomain_count > 3:
                score += 10
                indicators.append(f"Unusually many subdomains ({subdomain_count})")

            # ── URL length ──
            if len(url) > 100:
                score += 5
                indicators.append(f"Very long URL ({len(url)} characters)")

            # ── @ symbol ──
            if '@' in url:
                score += 35
                indicators.append("URL contains @ symbol — credential stealing attempt")

            # ── Double domain ──
            if re.search(r'https?://[^/]+\.(?:com|org|net)\.[^/]+/', url):
                score += 25
                indicators.append("Double domain pattern detected")

            # ── Suspicious keywords ──
            url_lower = url.lower()
            matched_keywords = [kw for kw in self.suspicious_keywords if kw in url_lower]
            if matched_keywords:
                kw_score = min(15, len(matched_keywords) * 5)
                score += kw_score
                indicators.append(f"Suspicious keywords in URL: {', '.join(matched_keywords[:3])}")

            # ── Hex encoding ──
            if re.search(r'%[0-9a-fA-F]{2}', url):
                score += 10
                indicators.append("URL contains percent-encoding")

            # ── Cyrillic (homograph) ──
            if re.search(r'[а-яА-Я]', hostname):
                score += 40
                indicators.append("Cyrillic characters in domain — homograph attack")

        except Exception as e:
            logger.error(f"URL analysis error: {e}")

        return min(100, score), indicators, brand_detected, warnings

    def _analyze_content(self, content: str) -> Tuple[float, List[str], List[str]]:
        """Analyze HTML content for phishing indicators."""
        score = 0
        indicators = []
        warnings = []

        try:
            content_lower = content.lower()

            if "password" in content_lower:
                score += 10
                indicators.append("Password input field detected")

            if "credit card" in content_lower or "creditcard" in content_lower:
                score += 25
                indicators.append("Credit card information requested")

            if "ssn" in content_lower or "social security" in content_lower:
                score += 30
                indicators.append("SSN requested — very high risk")

            form_actions = re.findall(r'<form[^>]*action=["\']([^"\']+)["\']', content, re.IGNORECASE)
            for action in form_actions:
                if action.startswith('http') and not action.startswith('https'):
                    score += 15
                    indicators.append("Form submits to insecure HTTP domain")
                elif action.startswith('http') and 'login' in action.lower():
                    score += 10
                    indicators.append("Form submits to external login domain")

            for brand in self.brands:
                if brand in content_lower:
                    if any(kw in content_lower for kw in ["urgent", "immediately", "verify", "suspended", "blocked"]):
                        score += 20
                        indicators.append(f"Urgent language with {brand} branding")
                    break

            if "display:none" in content_lower or "visibility:hidden" in content_lower:
                score += 10
                indicators.append("Hidden elements detected")

            if re.search(r'<iframe[^>]*src=["\']https?://', content, re.IGNORECASE):
                score += 10
                indicators.append("External iframe detected")

            if re.search(r'<script[^>]*>.*?(?:eval|fromCharCode|unescape|decodeURIComponent).*?</script>', content, re.IGNORECASE | re.DOTALL):
                score += 20
                indicators.append("JavaScript obfuscation detected")

            fake_warnings = [
                r'your\s+computer\s+is\s+infected',
                r'virus\s+detected',
                r'click\s+here\s+to\s+fix',
                r'microsoft\s+security\s+alert'
            ]
            for pattern in fake_warnings:
                if re.search(pattern, content_lower):
                    score += 25
                    indicators.append("Fake security warning detected")
                    break

            if re.search(r'countdown|timer|expires|remaining', content_lower):
                score += 10
                indicators.append("Countdown timer detected (urgency tactic)")

        except Exception as e:
            logger.error(f"Content analysis error: {e}")

        return min(100, score), indicators, warnings

    def _generate_explanation(self, is_phishing: bool, risk_level: str, indicators: List[str], brand: str = None) -> str:
        """Generate human-readable explanation."""
        if not is_phishing:
            if risk_level == "low":
                return f"Some suspicious elements detected ({indicators[0] if indicators else 'unknown'}). Proceed with caution."
            return "No significant phishing indicators detected. The URL and content appear legitimate."

        if risk_level == "critical":
            if brand:
                return f"⚠️ CRITICAL: Sophisticated phishing impersonating {brand}. Multiple strong indicators including {indicators[0] if indicators else 'suspicious patterns'}. Do NOT enter information."
            return f"⚠️ CRITICAL: Multiple strong phishing indicators detected. Almost certainly a malicious site."

        if risk_level == "high":
            if brand:
                return f"⚠️ HIGH RISK: Strong indicators of phishing impersonating {brand}. Detected: {indicators[0] if indicators else 'suspicious patterns'}."
            return f"⚠️ HIGH RISK: Strong phishing indicators detected. Do not trust this site."

        if brand:
            return f"⚠️ MEDIUM RISK: Several phishing indicators found, potentially impersonating {brand}."
        return f"⚠️ MEDIUM RISK: Several phishing indicators found. Verify before proceeding."


class MLPhishingDetector:
    """Simulated ML model for phishing detection."""

    def __init__(self):
        self.phishing_db = {
            "example-phishing.com": 0.95,
            "secure-login.xyz": 0.92,
            "paypal-verify.tk": 0.98,
            "appleid-confirm.ml": 0.96,
            "microsoft-update.ga": 0.94,
            "amazon-verify.cf": 0.93,
            "bank-account-verify.tk": 0.97,
            "netflix-account.xyz": 0.91
        }

        self.suspicious_patterns = [
            (r'verify.*account', 0.85),
            (r'confirm.*identity', 0.80),
            (r'secure.*login', 0.75),
            (r'update.*payment', 0.90)
        ]

    def predict(self, url: str) -> Dict[str, Any]:
        """Simulate ML-based prediction."""
        domain = urlparse(url).netloc

        if domain in self.phishing_db:
            return {
                "is_phishing": True,
                "confidence": self.phishing_db[domain],
                "model": "phishing_classifier_v1",
                "method": "database_match"
            }

        url_lower = url.lower()
        for pattern, confidence in self.suspicious_patterns:
            if re.search(pattern, url_lower):
                return {
                    "is_phishing": True,
                    "confidence": confidence,
                    "model": "phishing_classifier_v1",
                    "method": "pattern_match",
                    "matched_pattern": pattern
                }

        return {
            "is_phishing": False,
            "confidence": 0.15,
            "model": "phishing_classifier_v1",
            "method": "default"
        }