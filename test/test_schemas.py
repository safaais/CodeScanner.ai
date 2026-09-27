import pytest
from schemas import (
    CodeReviewRequest,
    CodeReviewResponse,
    CodeIssue,
    CodeReviewScores,
    ProgrammingLanguage
)

def test_code_review_request():
    """Test CodeReviewRequest schema"""
    request = CodeReviewRequest(
        code="print('Hello')",
        language="python",
        context="Test code",
        focus_areas=["security", "performance"]
    )
    
    assert request.code == "print('Hello')"
    assert request.language == ProgrammingLanguage.PYTHON
    assert request.context == "Test code"
    assert request.focus_areas == ["security", "performance"]

def test_code_issue():
    """Test CodeIssue schema"""
    issue = CodeIssue(
        severity="high",
        category="security",
        line_number=10,
        description="SQL injection",
        suggestion="Use parameterized queries",
        confidence=0.95
    )
    
    assert issue.severity == "high"
    assert issue.confidence == 0.95

def test_code_review_response():
    """Test CodeReviewResponse schema"""
    scores = CodeReviewScores(
        overall=8.5,
        quality=9.0,
        security=8.0,
        performance=9.0,
        maintainability=8.5,
        readability=9.0
    )
    
    issue = CodeIssue(
        severity="low",
        category="style",
        description="Test issue",
        suggestion="Fix it",
        confidence=0.8
    )
    
    response = CodeReviewResponse(
        summary="Good code",
        scores=scores,
        issues=[issue],
        recommendations=["Add tests"],
        best_practices_followed=["Good naming"],
        estimated_impact="low"
    )
    
    assert response.summary == "Good code"
    assert response.scores.overall == 8.5
    assert len(response.issues) == 1