# Question Manager

A local web application for managing exam questions. This manager helps you organize, edit, and export questions for exam preparation.

## Features

- **Multi-folder Support**: Manage multiple question decks from different directories
- **Subject Management**: Organize questions by subjects with custom colors and topics
- **Question CRUD**: Create, read, update, and delete questions
- **Image Support**: Upload and attach images to questions
- **Export**: Export all questions to a single JSON file with base64-encoded images
- **Persistent Configuration**: Remembers your folder paths between sessions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Adding a Folder

1. Click "Add Folder" button
2. Enter the absolute path to your questions folder (e.g., `/Users/username/questions`)
3. The folder should contain subjects following this structure:

```
questions/
├── subject-code/
│   ├── subject.json
│   └── questions/
│       ├── question-id/
│       │   ├── question.json
│       │   └── image.png (optional)
```

### Managing Questions

1. Select a folder from the list
2. Click on a subject to view its questions
3. Use "Add Question" to create new questions
4. Click "Edit" to modify existing questions
5. Click "Delete" to remove questions

### Exporting

Click the "Export Questions" button in the header to export all questions from the selected folder into a single JSON file with:
- Metadata (version, timestamp, hash)
- All subjects with their topics
- All questions with base64-encoded images

## File Format

### subject.json
```json
{
  "name": "Subject Name",
  "code": "subject-code",
  "description": "Description",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#1e40af",
  "topics": [
    { "id": "topic-id", "name": "Topic Name" }
  ]
}
```

### question.json
```json
{
  "question": "Question text with LaTeX: $x^2$",
  "questionType": "multichoice",
  "topics": ["topic-id"],
  "answers": [
    {
      "text": "Answer text",
      "isCorrect": true,
      "explanation": "Why this is correct"
    }
  ],
  "originalText": "Original text from PDF"
}
```

## Question Types

- `multichoice`: Multiple choice with one or more correct answers
- `open`: Open-ended question requiring text input
- `truefalse`: True/false question

## Technology Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- File System API (Node.js)
