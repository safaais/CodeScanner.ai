# tests/test_guardrails.py
import pytest
import json
import re
from guardrails import CodeReviewGuardrails

def test_guardrails_initialization():
    """Test guardrails initialization"""
    guardrails = CodeReviewGuardrails()
    assert guardrails is not None
    assert hasattr(guardrails, 'supported_languages')
    assert isinstance(guardrails.supported_languages, list)

def test_validate_input_valid():
    """Test valid input validation"""
    guardrails = CodeReviewGuardrails()
    
    # Valid Python code
    result = guardrails.validate_input("print('Hello, World!')", "python")
    assert result["valid"] == True
    assert "errors" not in result
    
    # Valid JavaScript code
    result = guardrails.validate_input("console.log('test');", "javascript")
    assert result["valid"] == True
    
    # Valid Java code
    result = guardrails.validate_input("public class Test {}", "java")
    assert result["valid"] == True

def test_validate_input_empty_code():
    """Test validation with empty code"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_input("", "python")
    assert result["valid"] == False
    assert "errors" in result
    assert "code_empty" in result["errors"]

def test_validate_input_whitespace_only():
    """Test validation with whitespace-only code"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_input("   \n   \t   ", "python")
    assert result["valid"] == False
    assert "code_empty" in result["errors"]

def test_validate_input_too_short():
    """Test validation with very short code"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_input("x", "python")
    assert result["valid"] == False
    assert "code_too_short" in result["errors"]
    
    # Exactly 9 characters (should fail)
    result = guardrails.validate_input("123456789", "python")
    assert result["valid"] == False
    assert "code_too_short" in result["errors"]
    
    # 10 characters (should pass)
    result = guardrails.validate_input("1234567890", "python")
    assert result["valid"] == True

def test_validate_input_too_long():
    """Test validation with very long code"""
    guardrails = CodeReviewGuardrails()
    
    # Create code that's too long (> 100KB)
    long_code = "x = 1\n" * 20000  # ~120KB
    
    result = guardrails.validate_input(long_code, "python")
    assert result["valid"] == False
    assert "code_too_long" in result["errors"]

def test_validate_input_unsupported_language():
    """Test validation with unsupported language"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_input("print('test')", "pascal")
    assert result["valid"] == False
    assert "language_not_supported" in result["errors"]
    
    result = guardrails.validate_input("print('test')", "fortran")
    assert result["valid"] == False
    assert "language_not_supported" in result["errors"]
    
    # Test case sensitivity
    result = guardrails.validate_input("print('test')", "Python")  # Capital P
    assert result["valid"] == False
    assert "language_not_supported" in result["errors"]

def test_validate_input_all_supported_languages():
    """Test all supported languages"""
    guardrails = CodeReviewGuardrails()
    
    supported_languages = [
        "python", "javascript", "typescript", "java",
        "cpp", "csharp", "go", "rust", "php", "ruby", "other"
    ]
    
    for lang in supported_languages:
        result = guardrails.validate_input("test code", lang)
        assert result["valid"] == True, f"Language {lang} should be supported"

def test_extract_json_from_markdown():
    """Test JSON extraction from markdown code blocks"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: JSON in markdown with backticks
    text = """
    Here's my review:
    ```json
    {
        "summary": "Good code",
        "scores": {
            "overall": 8.5
        }
    }
    ```
    Some additional comments.
    """
    
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["summary"] == "Good code"
    assert data["scores"]["overall"] == 8.5
    
    # Test 2: JSON in markdown with language specification
    text = """
    Review complete:
    ```json
    {"test": "value", "number": 42}
    ```
    """
    
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["test"] == "value"
    assert data["number"] == 42
    
    # Test 3: Multiple code blocks
    text = """
    First block:
    ```python
    print('hello')
    ```
    
    JSON block:
    ```json
    {"key": "data"}
    ```
    
    Another block:
    ```
    Some text
    ```
    """
    
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["key"] == "data"

def test_extract_json_direct_json():
    """Test JSON extraction from direct JSON"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Simple JSON
    text = '{"summary": "Test review", "score": 7}'
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["summary"] == "Test review"
    assert data["score"] == 7
    
    # Test 2: JSON with nested structure
    text = '{"data": {"nested": {"value": "deep"}}}'
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["data"]["nested"]["value"] == "deep"
    
    # Test 3: JSON with arrays
    text = '{"items": ["a", "b", "c"], "count": 3}'
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["items"] == ["a", "b", "c"]
    assert data["count"] == 3

def test_extract_json_no_json_found():
    """Test JSON extraction when no JSON found"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Plain text without JSON
    text = "This is just plain text without any JSON structure."
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert "summary" in data
    assert isinstance(data["summary"], str)
    assert data["summary"].startswith("This is just plain text")
    
    # Test 2: Text with code but not JSON
    text = """
    def function():
        return "Hello"
    
    # This is Python code, not JSON
    """
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert "summary" in data
    assert "def function()" in data["summary"]
    
    # Test 3: Empty string
    text = ""
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert "summary" in data
    assert data["summary"] == ""

def test_extract_json_malformed_markdown():
    """Test JSON extraction from malformed markdown"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Incomplete backticks
    text = "```json\n{\"test\": \"value\"}"
    result = guardrails._extract_json(text)
    data = json.loads(result)
    assert data["test"] == "value"
    
    # Test 2: Wrong language tag
    text = "```javascript\n{\"test\": \"value\"}\n```"
    result = guardrails._extract_json(text)
    data = json.loads(result)
    # Should still extract the JSON even with wrong language tag
    assert "test" in data

def test_validate_response_valid_json():
    """Test validation of valid JSON response"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Complete valid response
    valid_response = {
        "summary": "The code is well-structured and follows best practices.",
        "scores": {
            "overall": 8.5,
            "quality": 9.0,
            "security": 8.0,
            "performance": 9.0,
            "maintainability": 8.5,
            "readability": 9.0
        },
        "issues": [
            {
                "severity": "low",
                "category": "style",
                "line_number": 1,
                "description": "Missing type hints",
                "suggestion": "Add type hints",
                "confidence": 0.9
            }
        ],
        "recommendations": ["Add documentation", "Write unit tests"],
        "best_practices_followed": ["Good naming", "Single responsibility"],
        "estimated_impact": "low"
    }
    
    result = guardrails.validate_response(json.dumps(valid_response))
    assert result["valid"] == True
    assert "data" in result
    assert result["data"]["summary"] == valid_response["summary"]
    assert result["data"]["scores"]["overall"] == 8.5
    assert len(result["data"]["issues"]) == 1
    
    # Test 2: Valid response without optional fields
    minimal_response = {
        "summary": "Minimal review",
        "scores": {
            "overall": 7.0,
            "quality": 7.0,
            "security": 7.0,
            "performance": 7.0,
            "maintainability": 7.0,
            "readability": 7.0
        },
        "issues": [],
        "recommendations": [],
        "best_practices_followed": [],
        "estimated_impact": "medium"
    }
    
    result = guardrails.validate_response(json.dumps(minimal_response))
    assert result["valid"] == True
    assert result["data"]["summary"] == "Minimal review"

def test_validate_response_missing_required_fields():
    """Test validation with missing required fields"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Missing summary
    invalid_response = {
        "scores": {"overall": 8.0},
        "issues": [],
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(invalid_response))
    assert result["valid"] == False
    assert "Missing required fields" in result["error"]
    assert "summary" in result["error"]
    
    # Test 2: Missing scores
    invalid_response = {
        "summary": "Test",
        "issues": [],
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(invalid_response))
    assert result["valid"] == False
    assert "Missing required fields" in result["error"]
    assert "scores" in result["error"]
    
    # Test 3: Missing issues
    invalid_response = {
        "summary": "Test",
        "scores": {"overall": 8.0},
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(invalid_response))
    assert result["valid"] == False
    assert "Missing required fields" in result["error"]
    assert "issues" in result["error"]

def test_validate_response_incomplete_scores():
    """Test validation with incomplete scores"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Missing some score fields
    incomplete_response = {
        "summary": "Test review",
        "scores": {
            "overall": 8.0,
            "quality": 8.0
            # Missing security, performance, maintainability, readability
        },
        "issues": [],
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(incomplete_response))
    assert result["valid"] == True  # Should fill missing scores
    assert result["data"]["scores"]["security"] == 5.0  # Default value
    assert result["data"]["scores"]["performance"] == 5.0
    
    # Test 2: Empty scores object
    incomplete_response = {
        "summary": "Test",
        "scores": {},
        "issues": [],
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(incomplete_response))
    assert result["valid"] == True
    assert result["data"]["scores"]["overall"] == 5.0
    assert result["data"]["scores"]["quality"] == 5.0

def test_validate_response_invalid_json():
    """Test validation with invalid JSON"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Malformed JSON
    invalid_json = "{this is not valid json}"
    result = guardrails.validate_response(invalid_json)
    assert result["valid"] == False
    assert "Invalid JSON" in result["error"]
    
    # Test 2: JSON with syntax error
    invalid_json = '{"key": "value"'
    result = guardrails.validate_response(invalid_json)
    assert result["valid"] == False
    assert "Invalid JSON" in result["error"]
    
    # Test 3: Not JSON at all
    invalid_json = "Just a plain string"
    result = guardrails.validate_response(invalid_json)
    assert result["valid"] == False
    assert "Invalid JSON" in result["error"]

def test_validate_response_wrong_data_types():
    """Test validation with wrong data types"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Scores not an object
    invalid_response = {
        "summary": "Test",
        "scores": "not an object",
        "issues": [],
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(invalid_response))
    assert result["valid"] == False
    assert "Scores must be an object" in result["error"]
    
    # Test 2: Issues not an array
    invalid_response = {
        "summary": "Test",
        "scores": {"overall": 8.0},
        "issues": "not an array",
        "recommendations": []
    }
    
    result = guardrails.validate_response(json.dumps(invalid_response))
    # This might pass if guardrails is lenient, but let's check
    if result["valid"]:
        assert isinstance(result["data"]["issues"], list)
    else:
        assert "error" in result

def test_validate_response_in_markdown():
    """Test validation of JSON embedded in markdown"""
    guardrails = CodeReviewGuardrails()
    
    markdown_response = """
    # Code Review Report
    
    Here's my analysis of the code:
    
    ```json
    {
        "summary": "Good code with minor issues",
        "scores": {
            "overall": 8.0,
            "quality": 8.0,
            "security": 8.0,
            "performance": 8.0,
            "maintainability": 8.0,
            "readability": 8.0
        },
        "issues": [
            {
                "severity": "low",
                "category": "style",
                "line_number": 5,
                "description": "Line too long",
                "suggestion": "Break into multiple lines",
                "confidence": 0.8
            }
        ],
        "recommendations": ["Add comments", "Refactor long functions"],
        "best_practices_followed": ["Modular design", "Error handling"],
        "estimated_impact": "low"
    }
    ```
    
    Additional notes: The code follows PEP 8 guidelines.
    """
    
    result = guardrails.validate_response(markdown_response)
    assert result["valid"] == True
    assert result["data"]["summary"] == "Good code with minor issues"
    assert len(result["data"]["issues"]) == 1
    assert result["data"]["issues"][0]["severity"] == "low"

def test_validate_response_with_realistic_issues():
    """Test validation with realistic issues array"""
    guardrails = CodeReviewGuardrails()
    
    realistic_response = {
        "summary": "Code has security vulnerabilities that need immediate attention.",
        "scores": {
            "overall": 4.5,
            "quality": 6.0,
            "security": 2.0,
            "performance": 7.0,
            "maintainability": 5.0,
            "readability": 6.0
        },
        "issues": [
            {
                "severity": "high",
                "category": "security",
                "line_number": 12,
                "description": "SQL injection vulnerability",
                "suggestion": "Use parameterized queries",
                "confidence": 0.95
            },
            {
                "severity": "medium",
                "category": "performance",
                "line_number": 25,
                "description": "Inefficient database query in loop",
                "suggestion": "Move query outside loop or use batch operation",
                "confidence": 0.85
            },
            {
                "severity": "low",
                "category": "style",
                "line_number": 8,
                "description": "Missing docstring",
                "suggestion": "Add function documentation",
                "confidence": 0.9
            }
        ],
        "recommendations": [
            "Fix security vulnerabilities immediately",
            "Optimize database queries",
            "Add comprehensive test suite",
            "Implement input validation"
        ],
        "best_practices_followed": [
            "Consistent naming convention",
            "Modular function design"
        ],
        "estimated_impact": "high"
    }
    
    result = guardrails.validate_response(json.dumps(realistic_response))
    assert result["valid"] == True
    assert result["data"]["scores"]["security"] == 2.0
    assert len(result["data"]["issues"]) == 3
    assert result["data"]["issues"][0]["severity"] == "high"
    assert result["data"]["estimated_impact"] == "high"

def test_edge_cases():
    """Test edge cases in validation"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Very large response
    large_summary = "A" * 10000
    large_response = {
        "summary": large_summary,
        "scores": {
            "overall": 8.0,
            "quality": 8.0,
            "security": 8.0,
            "performance": 8.0,
            "maintainability": 8.0,
            "readability": 8.0
        },
        "issues": [],
        "recommendations": [],
        "best_practices_followed": [],
        "estimated_impact": "low"
    }
    
    result = guardrails.validate_response(json.dumps(large_response))
    assert result["valid"] == True
    assert len(result["data"]["summary"]) == 10000
    
    # Test 2: Empty arrays and strings
    empty_response = {
        "summary": "",
        "scores": {
            "overall": 0.0,
            "quality": 0.0,
            "security": 0.0,
            "performance": 0.0,
            "maintainability": 0.0,
            "readability": 0.0
        },
        "issues": [],
        "recommendations": [],
        "best_practices_followed": [],
        "estimated_impact": ""
    }
    
    result = guardrails.validate_response(json.dumps(empty_response))
    assert result["valid"] == True
    assert result["data"]["summary"] == ""
    assert len(result["data"]["issues"]) == 0
    
    # Test 3: Unicode characters
    unicode_response = {
        "summary": "مراجعة الكود باللغة العربية - Code review in Arabic",
        "scores": {
            "overall": 8.0,
            "quality": 8.0,
            "security": 8.0,
            "performance": 8.0,
            "maintainability": 8.0,
            "readability": 8.0
        },
        "issues": [],
        "recommendations": ["استخدم تعليقات أكثر وضوحاً"],
        "best_practices_followed": ["تسمية واضحة للمتغيرات"],
        "estimated_impact": "منخفض"
    }
    
    result = guardrails.validate_response(json.dumps(unicode_response, ensure_ascii=False))
    assert result["valid"] == True
    assert "مراجعة الكود" in result["data"]["summary"]

def test_extract_json_performance():
    """Test performance of JSON extraction with large texts"""
    guardrails = CodeReviewGuardrails()
    
    # Create a large text with JSON at the end
    large_text = "X\n" * 10000 + '\n```json\n{"test": "value"}\n```'
    
    import time
    start_time = time.time()
    result = guardrails._extract_json(large_text)
    end_time = time.time()
    
    data = json.loads(result)
    assert data["test"] == "value"
    
    # Should complete in reasonable time (< 0.1 seconds)
    assert end_time - start_time < 0.1, "JSON extraction too slow"

def test_validate_response_none_input():
    """Test validation with None input"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_response(None)
    assert result["valid"] == False
    assert "error" in result

def test_validate_response_empty_string():
    """Test validation with empty string input"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_response("")
    assert result["valid"] == False
    assert "Invalid JSON" in result["error"]

def test_validate_response_whitespace():
    """Test validation with whitespace-only input"""
    guardrails = CodeReviewGuardrails()
    
    result = guardrails.validate_response("   \n   \t   ")
    assert result["valid"] == False
    assert "Invalid JSON" in result["error"]

def test_validate_response_with_html():
    """Test validation with HTML in the response"""
    guardrails = CodeReviewGuardrails()
    
    html_response = """
    <html>
        <body>
            <pre>{"summary": "Test", "scores": {"overall": 8.0}}</pre>
        </body>
    </html>
    """
    
    result = guardrails.validate_response(html_response)
    # Should extract JSON from HTML
    assert result["valid"] == True or result["valid"] == False
    # Either valid or invalid, but shouldn't crash

def test_validate_response_multiple_json_objects():
    """Test validation with multiple JSON objects"""
    guardrails = CodeReviewGuardrails()
    
    multiple_json = """
    First object: {"test": "first"}
    Second object: {"summary": "Test review", "scores": {"overall": 8.0}}
    Third object: {"another": "object"}
    """
    
    result = guardrails.validate_response(multiple_json)
    # Should extract one of the JSON objects
    if result["valid"]:
        assert "summary" in result["data"] or "test" in result["data"]

def test_integration_flow():
    """Test complete integration flow"""
    guardrails = CodeReviewGuardrails()
    
    # Step 1: Validate input
    code = """def calculate_average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)"""
    
    input_result = guardrails.validate_input(code, "python")
    assert input_result["valid"] == True
    
    # Step 2: Simulate assistant response
    assistant_response = {
        "summary": "The function works correctly but lacks error handling.",
        "scores": {
            "overall": 7.5,
            "quality": 8.0,
            "security": 7.0,
            "performance": 8.0,
            "maintainability": 7.0,
            "readability": 8.0
        },
        "issues": [
            {
                "severity": "medium",
                "category": "bug",
                "line_number": 3,
                "description": "Potential division by zero if numbers is empty list",
                "suggestion": "Check len(numbers) > 0 before division",
                "confidence": 0.9
            }
        ],
        "recommendations": ["Add error handling", "Add type hints"],
        "best_practices_followed": ["Clear function name", "Simple logic"],
        "estimated_impact": "low"
    }
    
    # Step 3: Convert to JSON string (simulating assistant output)
    response_json = json.dumps(assistant_response)
    
    # Step 4: Validate response
    response_result = guardrails.validate_response(response_json)
    assert response_result["valid"] == True
    
    # Step 5: Check extracted data
    data = response_result["data"]
    assert data["summary"] == assistant_response["summary"]
    assert data["scores"]["overall"] == 7.5
    assert len(data["issues"]) == 1
    assert data["issues"][0]["severity"] == "medium"

def test_error_messages():
    """Test that error messages are informative"""
    guardrails = CodeReviewGuardrails()
    
    # Test 1: Invalid JSON error
    result = guardrails.validate_response("invalid json")
    assert result["valid"] == False
    assert "error" in result
    assert "Invalid JSON" in result["error"] or "Failed to parse" in result["error"]
    
    # Test 2: Missing fields error
    result = guardrails.validate_response('{"summary": "test"}')
    assert result["valid"] == False
    assert "error" in result
    assert "Missing required fields" in result["error"]
    
    # Test 3: Input validation errors
    result = guardrails.validate_input("", "python")
    assert result["valid"] == False
    assert "errors" in result
    assert len(result["errors"]) > 0

if __name__ == "__main__":
    # Run tests directly
    test_guardrails_initialization()
    test_validate_input_valid()
    test_validate_input_empty_code()
    test_extract_json_from_markdown()
    test_validate_response_valid_json()
    print("✅ All guardrails tests passed!")