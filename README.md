# AI Task Board

A personal task management web app with AI-powered task categorization and suggestions using Google Gemini API.

## Features

### 🎯 Core Features
- **6-Column Kanban Board**: Today, This Week, Important, Daily, Pending, Overdue
- **AI-Powered Categorization**: Automatically categorizes tasks based on deadlines and importance
- **Drag & Drop**: Move tasks between columns with smooth animations
- **Task Management**: Create, edit, delete, and complete tasks
- **Profile Management**: Configure your weekly schedule (work/sleep/free hours)
- **AI Suggestions**: Get task recommendations for your free time

### 🤖 AI Integration
- **Google Gemini API**: Uses Gemini 2.5 Pro for intelligent task categorization
- **Function Calling**: Structured AI responses for consistent categorization
- **Smart Suggestions**: AI recommends tasks that fit your available time
- **Fallback Logic**: Works without AI when API key is not configured

### 🎨 Modern UI/UX
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Smooth Animations**: Framer Motion for delightful interactions
- **Modern Styling**: TailwindCSS with clean, professional design
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Tech Stack

- **Frontend**: Next.js 15.4.4, React 19.1.0, TypeScript 5
- **Styling**: TailwindCSS v4, Framer Motion v12.23.9
- **Drag & Drop**: React DnD v16.0.1
- **AI Integration**: Google Gemini API (gemini-2.5-pro)
- **Form Management**: React Hook Form, Zod validation
- **Date Handling**: date-fns
- **State Management**: Custom hooks with localStorage persistence

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key (optional for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-task-board/web-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for AI features)
   ```bash
   cp env.example .env.local
   # Edit .env.local and add your Gemini API key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env.local` file

## Usage

### Basic Task Management
1. **Load Sample Data**: Click "Load Sample Data" to see the board in action
2. **Add Tasks**: Use the task input form (coming soon)
3. **Move Tasks**: Drag and drop tasks between columns
4. **Edit Tasks**: Click on task cards to edit details
5. **Complete Tasks**: Mark tasks as completed

### AI Features
- **Automatic Categorization**: New tasks are automatically placed in the correct column
- **Smart Suggestions**: AI recommends tasks for your free time slots
- **Intelligent Prioritization**: Important tasks are highlighted and prioritized

### Profile Management
- **Schedule Setup**: Configure your weekly work/sleep/free time
- **Time Block Management**: Add and edit time blocks for each day
- **Free Time Calculation**: See your available time for tasks

## Project Structure

```
web-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx (providers setup)
│   │   ├── page.tsx (main dashboard)
│   │   └── globals.css
│   ├── components/
│   │   ├── KanbanBoard/ (coming soon)
│   │   ├── TaskInput/ (coming soon)
│   │   ├── ProfileSection/ (coming soon)
│   │   └── common/
│   ├── lib/
│   │   ├── gemini.ts (AI integration)
│   │   ├── types.ts (TypeScript interfaces)
│   │   └── utils.ts (utility functions)
│   └── hooks/
│       ├── useTasks.ts (task management)
│       └── useProfile.ts (profile management)
```

## Development Status

### ✅ Completed
- [x] Project foundation and setup
- [x] TypeScript interfaces and types
- [x] Utility functions and helpers
- [x] Custom hooks for state management
- [x] Gemini AI service integration
- [x] Main dashboard with sample data
- [x] Local storage persistence

### 🔄 In Progress
- [ ] Kanban board component
- [ ] Task input form
- [ ] Profile management section

### 📋 Planned
- [ ] Drag & drop functionality
- [ ] AI suggestions integration
- [ ] Advanced task features
- [ ] Performance optimization
- [ ] Testing suite

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your browser, OS, and any error messages

---

**Built with ❤️ using Next.js, React, and Google Gemini AI**
