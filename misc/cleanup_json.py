import os
import json
from pathlib import Path

def normalize_question(q_content):
    changed = False
    
    # 1. Normalize questionType
    if 'question_type' in q_content:
        q_content['questionType'] = q_content.pop('question_type')
        changed = True
    
    # 2. Normalize originalText
    if 'original_text' in q_content:
        q_content['originalText'] = q_content.pop('original_text')
        changed = True
        
    # 3. Normalize topics
    if 'topic' in q_content:
        topic_val = q_content.pop('topic')
        if 'topics' not in q_content:
            q_content['topics'] = [topic_val] if topic_val else []
        elif topic_val and topic_val not in q_content['topics']:
            q_content['topics'].append(topic_val)
        changed = True
    
    if 'topics' not in q_content:
        q_content['topics'] = []
        changed = True
    elif not isinstance(q_content['topics'], list):
        q_content['topics'] = [q_content['topics']]
        changed = True

    # 4. Normalize answers
    if 'answers' in q_content:
        for ans in q_content['answers']:
            if 'is_correct' in ans:
                ans['isCorrect'] = ans.pop('is_correct')
                changed = True
    
    return q_content, changed

def main():
    base_path = Path(__file__).parent.resolve()
    questions_root = base_path / 'questions'
    
    count = 0
    updated = 0
    
    for root, dirs, files in os.walk(questions_root):
        if 'question.json' in files:
            file_path = Path(root) / 'question.json'
            count += 1
            
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError:
                    print(f"Error decoding {file_path}")
                    continue
            
            normalized_data, changed = normalize_question(data)
            
            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(normalized_data, f, indent=4, ensure_ascii=False)
                updated += 1

    print(f"Processed {count} questions. Updated {updated} files.")

if __name__ == "__main__":
    main()
