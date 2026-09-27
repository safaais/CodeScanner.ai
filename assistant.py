""" import time
import re
import json
import random
from typing import Dict, Any, Optional, List
from schemas import CodeReviewRequest, CodeIssue, CodeReviewScores
from guardrails import CodeReviewGuardrails
from config import settings

class MockCodeReviewAssistant:

  #  Mock assistant for testing - generates realistic code reviews
  

    
    def __init__(self):
        self.guardrails = CodeReviewGuardrails()
        self.mode = settings.ASSISTANT_MODE
        print(f"🤖 Initialized Mock Assistant (mode: {self.mode})")
    
    def _analyze_code_content(self, code: str, language: str) -> Dict[str, Any]:
        #Analyze code and generate realistic issues
        issues = []
        best_practices = []
        has_security_issues = False
        has_performance_issues = False
        
        # Security analysis
        security_patterns = {
            "python": [
                ("exec(", "high", "Use of exec() is dangerous", "Use safer alternatives"),
                ("eval(", "high", "Use of eval() is dangerous", "Use ast.literal_eval() or json.loads()"),
                ("input(", "medium", "Unsafe user input", "Validate and sanitize input"),
                ("os.system", "high", "Command injection risk", "Use subprocess with args list"),
                ("pickle.load", "high", "Unsafe deserialization", "Use json or safer serialization"),
            ],
            "javascript": [
                ("eval(", "high", "Use of eval() is dangerous", "Avoid eval, use JSON.parse()"),
                ("innerHTML", "medium", "Potential XSS vulnerability", "Use textContent or sanitize"),
                ("setTimeout(", "low", "String evaluation in setTimeout", "Use function reference instead"),
                ("document.write", "medium", "Potential DOM manipulation", "Use DOM methods instead"),
            ],
            "java": [
                ("Runtime.exec", "high", "Command injection risk", "Use ProcessBuilder with arguments"),
                ("Class.forName", "medium", "Dynamic class loading", "Validate class names"),
                ("ObjectInputStream", "high", "Unsafe deserialization", "Use validated deserialization"),
            ]
        }
        
        # Performance analysis
        performance_patterns = [
            ("for.*for", "medium", "Nested loops may be inefficient", "Consider using more efficient algorithms"),
            ("while True:", "medium", "Potential infinite loop", "Add proper exit condition"),
            ("sleep(", "low", "Blocking sleep calls", "Use async/await or timers"),
        ]
        
        # Style and best practices
        style_patterns = [
            ("TODO", "low", "TODO comment found", "Address TODO items before production"),
            ("FIXME", "low", "FIXME comment found", "Fix identified issues"),
            ("print(", "low", "Debug prints in code", "Remove or use proper logging"),
            ("console.log", "low", "Debug logs in production code", "Use proper logging framework"),
        ]
        
        # Check for security issues
        lang_patterns = security_patterns.get(language, [])
        for pattern, severity, desc, suggestion in lang_patterns:
            if pattern in code:
                issues.append({
                    "severity": severity,
                    "category": "security",
                    "line_number": self._find_line_number(code, pattern),
                    "description": desc,
                    "suggestion": suggestion,
                    "confidence": random.uniform(0.8, 0.95)
                })
                has_security_issues = True
        
        # Check for performance issues
        for pattern, severity, desc, suggestion in performance_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                issues.append({
                    "severity": severity,
                    "category": "performance",
                    "line_number": self._find_line_number(code, pattern.split()[0]),
                    "description": desc,
                    "suggestion": suggestion,
                    "confidence": random.uniform(0.7, 0.9)
                })
                has_performance_issues = True
        
        # Check for style issues
        for pattern, severity, desc, suggestion in style_patterns:
            if pattern in code:
                issues.append({
                    "severity": severity,
                    "category": "style",
                    "line_number": self._find_line_number(code, pattern),
                    "description": desc,
                    "suggestion": suggestion,
                    "confidence": random.uniform(0.6, 0.8)
                })
        
        # Check for best practices
        if "def " in code or "function " in code:
            best_practices.append("Uses functions for modularity")
        if "#" in code or "//" in code or "/*" in code:
            best_practices.append("Includes comments")
        if "import " in code or "require(" in code or "using " in code:
            best_practices.append("Uses proper imports")
        if "try:" in code or "catch" in code or "except" in code:
            best_practices.append("Includes error handling")
        if "test" in code.lower() or "Test" in code:
            best_practices.append("May include tests")
        
        return {
            "issues": issues,
            "best_practices": best_practices,
            "has_security_issues": has_security_issues,
            "has_performance_issues": has_performance_issues,
            "code_length": len(code),
            "has_functions": "def " in code or "function " in code or "public " in code,
            "has_comments": "#" in code or "//" in code or "/*" in code,
        }
    
    def _find_line_number(self, code: str, pattern: str) -> Optional[int]:
        #Find line number where pattern appears
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            if pattern in line:
                return i
        return None
    
    def _calculate_scores(self, analysis: Dict[str, Any]) -> Dict[str, float]:
        #Calculate realistic scores based on analysis
        base_score = 7.0
        
        # Adjust based on issues
        security_multiplier = 0.8 if analysis["has_security_issues"] else 1.0
        performance_multiplier = 0.9 if analysis["has_performance_issues"] else 1.0
        
        # Adjust based on best practices
        best_practice_bonus = len(analysis["best_practices"]) * 0.3
        structure_bonus = 0.5 if analysis["has_functions"] else 0.0
        documentation_bonus = 0.5 if analysis["has_comments"] else 0.0
        
        overall = min(10.0, base_score + best_practice_bonus + structure_bonus + documentation_bonus)
        
        return {
            "overall": round(overall, 1),
            "quality": round(overall * 0.95, 1),
            "security": round(base_score * security_multiplier, 1),
            "performance": round(base_score * performance_multiplier, 1),
            "maintainability": round(overall * 1.05, 1),
            "readability": round(overall + documentation_bonus, 1)
        }
    
    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        #Generate realistic recommendations
        recommendations = []
        
        if analysis["has_security_issues"]:
            recommendations.append("Address security vulnerabilities")
        
        if analysis["has_performance_issues"]:
            recommendations.append("Optimize performance-critical sections")
        
        if not analysis["has_comments"]:
            recommendations.append("Add comments and documentation")
        
        if len(analysis["issues"]) > 0:
            recommendations.append("Fix identified issues")
        
        # Always include some standard recommendations
        standard_recommendations = [
            "Add unit tests",
            "Implement error handling",
            "Consider edge cases",
            "Review with team members",
            "Run static analysis tools"
        ]
        
        recommendations.extend(random.sample(standard_recommendations, 2))
        return recommendations
    
    def review_code(self, request: CodeReviewRequest) -> Dict[str, Any]:
        #Review code using mock analysis
        start_time = time.time()
        
        # Validate input
        input_validation = self.guardrails.validate_input(
            request.code,
            request.language.value
        )
        
        if not input_validation["valid"]:
            return {
                "success": False,
                "error": f"Input validation failed: {input_validation.get('errors')}",
                "validation_time": time.time() - start_time
            }
        
        # Simulate processing delay
        if settings.MOCK_RESPONSE_DELAY > 0:
            time.sleep(settings.MOCK_RESPONSE_DELAY)
        
        # Simulate random errors (for testing error handling)
        if settings.ENABLE_RANDOM_ERRORS and random.random() < 0.1:
            return {
                "success": False,
                "error": "Simulated random error (for testing)",
                "review_time": time.time() - start_time
            }
        
        try:
            # Analyze code
            analysis = self._analyze_code_content(request.code, request.language.value)
            
            # Calculate scores
            scores = self._calculate_scores(analysis)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(analysis)
            
            # Create summary
            summary = self._create_summary(request, analysis, scores)
            
            # Prepare response data
            response_data = {
                "summary": summary,
                "scores": scores,
                "issues": analysis["issues"],
                "recommendations": recommendations,
                "best_practices_followed": analysis["best_practices"],
                "estimated_impact": self._estimate_impact(analysis)
            }
            
            # Validate our own response
            validation_result = self.guardrails.validate_response(json.dumps(response_data))
            
            if validation_result["valid"]:
                return {
                    "success": True,
                    "data": response_data,
                    "review_time": time.time() - start_time,
                    "mode": "mock",
                    "analysis_details": {
                        "code_length": analysis["code_length"],
                        "issues_found": len(analysis["issues"]),
                        "best_practices": len(analysis["best_practices"])
                    }
                }
            else:
                # Fallback to simple response
                return self._create_fallback_response(request, start_time)
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Mock analysis error: {str(e)}",
                "review_time": time.time() - start_time
            }
    
    def _create_summary(self, request: CodeReviewRequest, analysis: Dict[str, Any], scores: Dict[str, float]) -> str:
        #Create realistic summary
        language = request.language.value
        context = request.context or "code"
        
        issues_count = len(analysis["issues"])
        security_issues = sum(1 for issue in analysis["issues"] if issue["category"] == "security")
        
        summary_parts = []
        
        if issues_count == 0:
            summary_parts.append(f"The {language} {context} looks good overall.")
        elif issues_count <= 2:
            summary_parts.append(f"The {language} {context} has some minor issues that need attention.")
        else:
            summary_parts.append(f"The {language} {context} requires significant improvements.")
        
        if security_issues > 0:
            summary_parts.append(f"Found {security_issues} security issue(s) that should be addressed.")
        
        if analysis["has_functions"]:
            summary_parts.append("Good use of functions for modularity.")
        
        if analysis["has_comments"]:
            summary_parts.append("Code includes helpful comments.")
        else:
            summary_parts.append("Consider adding more comments for clarity.")
        
        summary_parts.append(f"Overall score: {scores['overall']}/10")
        
        return " ".join(summary_parts)
    
    def _estimate_impact(self, analysis: Dict[str, Any]) -> str:
        #Estimate impact of changes
        security_issues = sum(1 for issue in analysis["issues"] if issue["severity"] == "high")
        
        if security_issues > 0:
            return "high"
        elif len(analysis["issues"]) > 3:
            return "medium"
        else:
            return "low"
    
    def _create_fallback_response(self, request: CodeReviewRequest, start_time: float) -> Dict[str, Any]:
        #Create fallback response if validation fails
        return {
            "success": True,
            "data": {
                "summary": f"Mock review of {request.language.value} code",
                "scores": {
                    "overall": 7.5,
                    "quality": 7.5,
                    "security": 7.5,
                    "performance": 7.5,
                    "maintainability": 7.5,
                    "readability": 7.5
                },
                "issues": [],
                "recommendations": ["Review completed successfully"],
                "best_practices_followed": ["Mock analysis completed"],
                "estimated_impact": "low"
            },
            "review_time": time.time() - start_time,
            "mode": "mock",
            "warning": "Using fallback response"
        }
    
    def is_available(self) -> bool:
        #Mock assistant is always available
        return True """

import json
from openai import OpenAI
from config import settings
from schemas import CodeReviewRequest

class CodeReviewAssistant:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def review_code(self, request: CodeReviewRequest):
        # تعليمات صارمة جداً للموديل ليلتزم بالصيغة المطلوبة في schemas.py
        prompt = f"""
        Review the following {request.language} code.
        Return ONLY a JSON object with this exact structure:
        {{
            "summary": "string",
            "scores": {{"overall": 0.0, "quality": 0.0, "security": 0.0, "performance": 0.0, "maintainability": 0.0, "readability": 0.0}},
            "issues": [{{ "severity": "high/medium/low", "category": "security/bug/style", "line_number": 1, "description": "text", "suggestion": "text", "confidence": 0.9 }}],
            "recommendations": ["text"],
            "best_practices_followed": ["text"],
            "estimated_impact": "low/medium/high"
        }}

        CODE:
        {request.code}
        """
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a senior code reviewer API. You must respond ONLY with valid JSON matching the user's schema."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        full_result = json.loads(response.choices[0].message.content)

        # إذا قام الموديل بوضع النتائج داخل مفتاح 'codeReview' بالخطأ، سنقوم باستخراجها
        if "codeReview" in full_result:
            data = full_result["codeReview"]
            # محاولة إصلاح المسميات إذا كانت مختلفة
            return {
                "summary": data.get("overallAssessment", "Review completed"),
                "scores": data.get("scores", {"overall": 5, "quality": 5, "security": 5, "performance": 5, "maintainability": 5, "readability": 5}),
                "issues": data.get("issues", []),
                "recommendations": data.get("suggestions", []),
                "best_practices_followed": data.get("best_practices", []),
                "estimated_impact": data.get("impact", "medium")
            }
            
        return full_result