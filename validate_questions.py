import os
import json
import sys
from pathlib import Path

ALLOWED_KEYS = {
    'question',
    'questionType',
    'topics',
    'answers',
    'originalText'
}

ALLOWED_ANSWER_KEYS = {
    'text',
    'isCorrect'
}

def validate():
    base_path = Path(__file__).parent.resolve()
    source_dir = base_path / 'questions'
    
    question_ids = []
    errors = []

    for subject_folder in source_dir.iterdir():
        if not subject_folder.is_dir():
            continue
            
        # Subject level validation
        subject_json = subject_folder / 'subject.json'
        if not subject_json.exists():
            errors.append(f"Subject {subject_folder.name} is missing subject.json")

        # Check questions in subject/questions/ID
        flat_questions_dir = subject_folder / 'questions'
        if flat_questions_dir.exists():
            for question_folder in flat_questions_dir.iterdir():
                if not question_folder.is_dir() or question_folder.name.startswith('.'):
                    continue
                
                question_id = question_folder.name
                question_ids.append(question_id)
                
                q_json_path = question_folder / 'question.json'
                if not q_json_path.exists():
                    errors.append(f"Question {question_id} in {subject_folder.name} is missing question.json")
                    continue
                
                with open(q_json_path, 'r', encoding='utf-8') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        errors.append(f"Question {question_id} has invalid JSON")
                        continue
                
                # Check for invalid keys
                extra_keys = set(data.keys()) - ALLOWED_KEYS
                if extra_keys:
                    errors.append(f"Question {question_id} contains forbidden keys: {', '.join(extra_keys)}")
                
                # Check for required keys
                missing_keys = {'question', 'questionType', 'topics', 'answers'} - set(data.keys())
                if missing_keys:
                    errors.append(f"Question {question_id} is missing required keys: {', '.join(missing_keys)}")

                # Check answers
                if 'answers' in data and isinstance(data['answers'], list):
                    for idx, ans in enumerate(data['answers']):
                        ans_extra_keys = set(ans.keys()) - ALLOWED_ANSWER_KEYS
                        if ans_extra_keys:
                            errors.append(f"Answer {idx} in question {question_id} has forbidden keys: {', '.join(ans_extra_keys)}")

    # Check for duplicate IDs across all subjects
    duplicates = [qid for qid in set(question_ids) if question_ids.count(qid) > 1]
    if duplicates:
        errors.append(f"Duplicate question IDs found: {', '.join(duplicates)}")

    if errors:
        print("Validation failed:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    
    print("All questions validated successfully.")

if __name__ == "__main__":
    validate()
