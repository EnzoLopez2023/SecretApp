# SecretApp - Comprehensive Workshop & Media Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/EnzoLopez2023/SecretApp)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5+-0081CB.svg)](https://mui.com/)
[![Educational](https://img.shields.io/badge/Educational-Ready-yellow.svg)](#educational-features)

> A feature-rich, educational workshop and media management application built with React, TypeScript, and Azure OpenAI. Designed as both a functional application and a comprehensive learning resource for students and developers.

## 🌟 Overview

SecretApp is a modern, full-stack web application that combines intelligent AI assistance with practical workshop management tools. It serves as both a powerful productivity suite and an educational codebase for learning modern web development practices.

## 🎯 Key Features

### 🤖 AI-Powered Chat Assistant
- **Azure OpenAI GPT-5 Integration**: Advanced AI conversations with context awareness
- **Plex Media Intelligence**: Smart movie library queries and recommendations
- **Shop Data Analysis**: AI-powered insights about woodworking inventory
- **Conversation Persistence**: Save and manage multiple conversation threads
- **Real-time Responses**: Fast, intelligent responses with markdown formatting

### 🏪 Workshop Management Suite
- **Tool Inventory System**: Complete CRUD operations for workshop tools
- **Advanced Search & Filtering**: Multi-criteria tool discovery
- **Image Management**: Upload and display tool photos
- **Price Tracking**: Monitor tool costs and inventory values
- **Location Management**: Track tool storage locations

### 🎬 Media Library Analytics
- **Plex Integration**: Direct connection to Plex media servers
- **Movie Discovery**: Advanced filtering by genre, year, rating, cast
- **Library Statistics**: Comprehensive analytics about your collection
- **Random Recommendations**: "What should I watch?" suggestions
- **Technical Metadata**: Display video quality, codecs, and specifications

### 🔨 Project Management
- **Woodworking Projects**: Track projects from planning to completion
- **File Management**: Upload plans, photos, and documentation
- **PDF Viewer**: Built-in PDF viewing for project plans
- **Progress Tracking**: Status management and timeline tracking
- **Material Lists**: Track wood types, hardware, and supplies

### 🔐 Enterprise Authentication
- **Azure Active Directory**: Secure enterprise-grade authentication
- **Single Sign-On (SSO)**: Seamless login experience
- **User Management**: Role-based access and permissions
- **Session Management**: Secure token handling

### 📱 Modern User Experience
- **Responsive Design**: Perfect on mobile, tablet, and desktop
- **Material Design 3**: Beautiful, consistent UI components
- **Dark/Light Themes**: Customizable appearance
- **Real-time Updates**: Live data synchronization
- **Offline Capabilities**: PWA features for offline use

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18**: Latest React with concurrent features
- **TypeScript**: Full type safety and developer experience
- **Material-UI v5**: Modern component library
- **Vite**: Fast build tool and development server
- **PDF.js**: In-browser PDF viewing capabilities

### Backend Integration
- **Node.js/Express**: RESTful API server
- **MySQL Database**: Persistent data storage
- **Azure OpenAI**: GPT-5 chat completions
- **Plex API**: Media server integration
- **File Upload**: Multipart form handling

### Cloud Services
- **Azure Active Directory**: Authentication and user management
- **Azure OpenAI Service**: AI language model hosting
- **Cloud Storage**: File and image storage

## 📚 Educational Features

> **🎓 Learning-First Design**: This codebase is extensively commented and structured as an educational resource for students and developers learning modern web development.

### 📖 Comprehensive Code Documentation

Every major file includes detailed educational comments covering:

#### **Beginner Concepts**
- React component structure and JSX syntax
- State management with `useState` and `useEffect`
- Event handling and user interactions
- TypeScript basics and type safety
- Component props and data flow

#### **Intermediate Concepts**
- Advanced React hooks (`useMemo`, `useCallback`, `useRef`)
- Complex state management patterns
- API integration and async programming
- Form validation and error handling
- Responsive design principles

#### **Advanced Concepts**
- Performance optimization techniques
- AI integration and context enrichment
- Database design and operations
- Authentication and security patterns
- Production deployment strategies

### 🧠 Learning Outcomes

Students working with this codebase will learn:

1. **Modern React Development**
   - Component architecture and composition
   - Hook-based state management
   - Performance optimization
   - Testing strategies

2. **TypeScript Mastery**
   - Interface design and type safety
   - Generic types and advanced patterns
   - Error handling and type guards
   - Integration with React

3. **Full-Stack Integration**
   - RESTful API design
   - Database modeling and queries
   - File upload and management
   - Real-time data synchronization

4. **Enterprise Patterns**
   - Authentication and authorization
   - Error boundaries and logging
   - Code organization and modularity
   - Production deployment

### 📋 Commented File Structure

```
src/
├── 📄 main.tsx              # App bootstrap & provider patterns
├── 📄 App.tsx               # Routing & layout management
├── 📄 Dashboard.tsx         # Homepage & navigation patterns
├── 📄 ChatApp.tsx           # Chat interface & AI integration
├── 📄 MyShopTools.tsx       # Inventory CRUD operations
├── 📄 PlexMovieInsights.tsx # Media discovery & analytics
├── 📄 WoodworkingProjects.tsx # Project management system
├── ChatAgent/
│   └── 📄 PlexAgent.ts      # AI context generation & API integration
├── auth/
│   ├── 📄 AuthGuard.tsx     # Authentication protection
│   ├── 📄 LoginPage.tsx     # Login interface
│   └── 📄 msalConfig.ts     # Azure AD configuration
├── services/
│   ├── 📄 conversationService.ts # Chat persistence
│   └── 📄 projectService.ts     # Project data management
└── components/
    └── 📄 VersionDisplay.tsx    # Version management
```

Each file contains:
- **Purpose explanations**: What the component does and why
- **Learning callouts**: Key concepts highlighted for students
- **Code walkthroughs**: Step-by-step explanation of complex logic
- **Best practices**: Production-ready patterns and techniques
- **Architecture diagrams**: ASCII art showing data flow

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+ database
- Azure OpenAI API key
- Plex Media Server (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EnzoLopez2023/SecretApp.git
   cd SecretApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit .env with your configuration
   AZURE_OPENAI_ENDPOINT=your_endpoint
   AZURE_OPENAI_KEY=your_api_key
   MYSQL_HOST=localhost
   MYSQL_DATABASE=secretapp
   PLEX_URL=your_plex_server_url
   PLEX_TOKEN=your_plex_token
   ```

4. **Set up the database**
   ```bash
   # Run database migrations
   npm run db:migrate
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to your hosting platform
npm run deploy
```

## 🔧 Configuration

### Azure OpenAI Setup
1. Create an Azure OpenAI resource
2. Deploy a GPT-4 or GPT-5 model
3. Copy the endpoint and API key to your `.env` file

### Plex Integration
1. Install and configure Plex Media Server
2. Generate a Plex authentication token
3. Add your server URL and token to the configuration

### Database Schema
The application uses MySQL with the following main tables:
- `conversations` - Chat conversation metadata
- `conversation_messages` - Individual chat messages
- `myshop_inventory` - Workshop tool inventory
- `myshop_images` - Tool images and attachments
- `woodworking_projects` - Project information
- `project_files` - Project file attachments

## 📊 Application Modules

### 1. AI Chat Assistant (`ChatApp.tsx`)
**Purpose**: Intelligent conversation interface with context awareness

**Features**:
- Real-time chat with Azure OpenAI GPT-5
- Conversation persistence and management
- Plex media queries with library context
- Shop inventory analysis and insights
- Markdown rendering for rich responses

**Learning Focus**: React state management, API integration, real-time updates

### 2. Shop Tool Manager (`MyShopTools.tsx`)
**Purpose**: Complete inventory management for workshop tools

**Features**:
- CRUD operations for tool inventory
- Image upload and gallery management
- Advanced search and filtering
- Price tracking and analytics
- Location and organization management

**Learning Focus**: Complex forms, file uploads, database operations

### 3. Media Library Insights (`PlexMovieInsights.tsx`)
**Purpose**: Movie discovery and library analytics

**Features**:
- Plex server integration and authentication
- Advanced movie filtering and search
- Library statistics and insights
- Random movie recommendations
- Technical metadata display

**Learning Focus**: External API integration, data visualization, performance optimization

### 4. Project Workshop (`WoodworkingProjects.tsx`)
**Purpose**: Woodworking project management and tracking

**Features**:
- Project lifecycle management
- File and document management
- PDF viewing capabilities
- Progress tracking and status updates
- Material and cost tracking

**Learning Focus**: File handling, PDF integration, project management patterns

### 5. Plex Intelligence Agent (`PlexAgent.ts`)
**Purpose**: Smart context generation for media-related AI queries

**Features**:
- Natural language processing for movie queries
- Library context enrichment
- Movie recommendation logic
- Multi-library search prioritization
- External movie database integration

**Learning Focus**: AI context generation, text processing, API orchestration

## 🎓 Educational Use Cases

### For Computer Science Students
- **React Development**: Modern component patterns and hooks
- **TypeScript**: Progressive type safety implementation
- **Database Design**: Relational modeling and optimization
- **API Design**: RESTful services and integration patterns

### For Web Development Bootcamps
- **Full-Stack Development**: End-to-end application development
- **Modern Tooling**: Vite, TypeScript, and development workflows
- **Production Deployment**: Build optimization and hosting
- **User Experience**: Responsive design and accessibility

### For Software Engineering Courses
- **Architecture Patterns**: Component design and separation of concerns
- **Testing Strategies**: Unit testing and integration testing
- **Code Quality**: Linting, formatting, and documentation
- **Performance**: Optimization techniques and monitoring

## 🛠️ Development Workflow

### Code Quality Tools
- **TypeScript**: Compile-time type checking
- **ESLint**: Code linting and style enforcement
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality gates

### Testing Strategy
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and database testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load and stress testing

### Deployment Pipeline
- **Development**: Local development with hot reload
- **Staging**: Preview deployments for testing
- **Production**: Optimized builds with monitoring
- **CI/CD**: Automated testing and deployment

## 📈 Performance Features

### Frontend Optimization
- **Code Splitting**: Lazy loading of route components
- **Bundle Analysis**: Webpack bundle optimization
- **Image Optimization**: Responsive images and lazy loading
- **Caching**: Service worker and browser caching

### Backend Performance
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Response Caching**: API response optimization
- **File Compression**: Asset optimization and delivery

## 🔒 Security Features

### Authentication & Authorization
- **Azure AD Integration**: Enterprise-grade authentication
- **JWT Token Management**: Secure session handling
- **Role-Based Access**: Granular permission system
- **CORS Configuration**: Cross-origin request security

### Data Protection
- **Input Validation**: Comprehensive data sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **File Upload Security**: Type and size validation

## 🌍 Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Progressive Web App**: Offline capabilities and installation
- **Responsive Design**: Mobile-first responsive layouts

## 🤝 Contributing

We welcome contributions from developers of all skill levels! This project is designed to be educational, so contributions that improve learning outcomes are especially valued.

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with detailed comments
4. Add or update tests as needed
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Contribution Guidelines
- **Educational Focus**: Ensure code is well-commented and educational
- **Type Safety**: Use TypeScript for all new code
- **Testing**: Include tests for new functionality
- **Documentation**: Update README and code comments
- **Performance**: Consider performance implications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team**: For the amazing React framework
- **Microsoft**: For Azure OpenAI and authentication services
- **Material-UI Team**: For the beautiful component library
- **Plex**: For the media server platform
- **TypeScript Team**: For making JavaScript development safer
- **Open Source Community**: For the countless libraries that make this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/EnzoLopez2023/SecretApp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/EnzoLopez2023/SecretApp/discussions)
- **Documentation**: See the extensive code comments throughout the project
- **Educational Questions**: Welcome in the discussions section

---

**Built with ❤️ for education and productivity**

*This project demonstrates modern web development practices while serving as a comprehensive learning resource. Whether you're a student learning to code or an experienced developer exploring new patterns, SecretApp provides real-world examples of best practices in action.*