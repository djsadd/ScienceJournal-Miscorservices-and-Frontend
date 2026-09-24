import unittest

from app.ai_client import AIProviderError, _validate_result


class ValidateResultTests(unittest.TestCase):
    def valid_result(self):
        return {
            "review_text": "A useful review",
            "recommendation": "major_revision",
            "strengths": ["Clear objective"],
            "weaknesses": ["Small sample"],
            "publication_recommendations": ["Add a power calculation"],
            "scores": {
                "novelty": 3,
                "methodology": 2,
                "clarity": 4,
                "significance": 3,
                "reproducibility": 2,
            },
        }

    def test_accepts_valid_structured_review(self):
        result = self.valid_result()
        self.assertIs(_validate_result(result), result)

    def test_rejects_unknown_recommendation(self):
        result = self.valid_result()
        result["recommendation"] = "publish_immediately"
        with self.assertRaises(AIProviderError):
            _validate_result(result)

    def test_rejects_score_outside_scale(self):
        result = self.valid_result()
        result["scores"]["novelty"] = 6
        with self.assertRaises(AIProviderError):
            _validate_result(result)


if __name__ == "__main__":
    unittest.main()

