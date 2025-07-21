# Copilot Instructions for Livechat Widget

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a React TypeScript project for a customer-facing livechat widget that can be embedded in OSS (Online Single Submission) business licensing websites. The widget provides real-time chat support for users seeking help with business licensing processes.

## Technical Stack
- React 18 with TypeScript
- Vite for build tooling
- WebSocket for real-time communication
- CSS Modules or Styled Components for styling
- Integration with livechat-be backend API

## Key Features
- Embeddable chat widget that can be integrated into any website
- Real-time messaging between customers and admin support
- Responsive design that works on desktop and mobile
- Customizable appearance and branding
- Support for file attachments and media
- Chat history and session management
- Typing indicators and message status
- Offline/online status detection

## Code Guidelines
- Use functional components with hooks
- Implement proper TypeScript types for all data structures
- Follow React best practices for state management
- Use proper error handling for API calls and WebSocket connections
- Implement accessibility features (ARIA labels, keyboard navigation)
- Write clean, maintainable, and well-documented code
- Use modern ES6+ features and async/await for asynchronous operations

## API Integration
- Backend API endpoint: http://localhost:8000 (development)
- WebSocket connection for real-time messaging
- RESTful API for chat history, user management, and configuration
- Proper authentication and authorization handling

## Embedding Instructions
The widget should be easily embeddable using a simple script tag and initialization code that website owners can add to their pages.
