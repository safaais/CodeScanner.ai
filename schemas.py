from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


# ── Code Review Schemas ───────────────────────────────────────────────────────

class ProgrammingLanguage(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    JAVA = "java"
    CPP = "cpp"
    CSHARP = "csharp"
    GO = "go"
    RUST = "rust"
    PHP = "php"
    RUBY = "ruby"
    OTHER = "other"


class CodeReviewRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=50000, description="Source code to review")
    language: ProgrammingLanguage = Field(default=ProgrammingLanguage.PYTHON, description="Programming language")
    context: Optional[str] = Field(default=None, description="Additional context about the code")
    requirements: Optional[str] = Field(default=None, description="Specific requirements to check")
    focus_areas: Optional[List[str]] = Field(default=None, description="Areas to focus on")


class CodeIssue(BaseModel):
    severity: str = Field(..., description="high, medium, low")
    category: str = Field(..., description="security, performance, bug, style, maintainability")
    line_number: Optional[int] = Field(None, description="Line number where issue occurs")
    description: str = Field(..., description="Description of the issue")
    suggestion: str = Field(..., description="Suggested fix")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")


class CodeReviewScores(BaseModel):
    overall: float = Field(..., ge=0.0, le=10.0)
    quality: float = Field(..., ge=0.0, le=10.0)
    security: float = Field(..., ge=0.0, le=10.0)
    performance: float = Field(..., ge=0.0, le=10.0)
    maintainability: float = Field(..., ge=0.0, le=10.0)
    readability: float = Field(..., ge=0.0, le=10.0)


class CodeReviewResponse(BaseModel):
    summary: str
    scores: CodeReviewScores
    issues: List[CodeIssue]
    recommendations: List[str]
    best_practices_followed: List[str]
    estimated_impact: str  # low, medium, high


# ── URL Scan Schemas ──────────────────────────────────────────────────────────

class URLScanRequest(BaseModel):
    url: str = Field(..., min_length=7, max_length=2048, description="The URL to scan")


class URLScanIssue(BaseModel):
    severity: str
    category: str
    description: str
    suggestion: str


class URLScanScores(BaseModel):
    overall: float = Field(..., ge=0.0, le=10.0)
    security: float = Field(..., ge=0.0, le=10.0)
    performance: float = Field(..., ge=0.0, le=10.0)
    privacy: float = Field(..., ge=0.0, le=10.0)


class URLScanResponse(BaseModel):
    success: bool
    url: str
    final_url: Optional[str] = None
    status_code: Optional[int] = None
    scan_time: float
    scores: Optional[URLScanScores] = None
    summary: Optional[str] = None
    issues: Optional[List[URLScanIssue]] = None
    recommendations: Optional[List[str]] = None
    phishing_detection: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    error_type: Optional[str] = None


# ── Phishing Detection Schemas ────────────────────────────────────────────────

class PhishingDetectionRequest(BaseModel):
    url: Optional[str] = Field(None, description="URL to check for phishing")
    content: Optional[str] = Field(None, description="HTML/content to analyze")


class PhishingDetectionResponse(BaseModel):
    success: bool
    url: Optional[str] = None
    detection: Dict[str, Any]
    timestamp: str


class BatchPhishingRequest(BaseModel):
    urls: List[str] = Field(..., description="List of URLs to check", min_items=1, max_items=50)


class BatchPhishingResponse(BaseModel):
    total_checked: int
    phishing_detected: int
    results: List[Dict[str, Any]]
    timestamp: str


# ── Health Check Schemas ──────────────────────────────────────────────────────

class HealthCheckResponse(BaseModel):
    status: str
    assistant_available: bool
    mode: str
    timestamp: str