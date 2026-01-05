# newtonAI

> AI-Powered PDF Learning Assistant - Upload any PDF and discover curated educational videos for every topic

newtonAI is a full-stack web application that revolutionizes how you learn from documents. Simply upload a PDF (textbook, research paper, manual, etc.), and our AI will extract key topics and find the best animated educational videos from YouTube to help you understand each concept.

## ✨ Features

- **🤖 AI-Powered Topic Extraction**: Uses Lovable AI (Gemini 2.5 Flash) to intelligently extract topics and summaries from your PDFs
- **📹 Curated Educational Videos**: Automatically finds high-quality animated educational videos from YouTube for each topic
- **🎯 Smart Search**: Target top educational channels for the most effective learning content
- **🔄 Find More Videos**: Expand your learning with additional video suggestions per topic
- **🎨 Beautiful UI**: Modern, responsive design with smooth animations and intuitive interactions
- **⚡ Lightning Fast**: Process PDFs and get results in seconds

## 🚀 How It Works

1. **Upload**: Drag and drop any PDF or click to browse
2. **AI Analysis**: Our AI reads your document and extracts 5-8 key topics with summaries
3. **Video Discovery**: For each topic, we search YouTube for the best educational animated videos
4. **Learn**: Watch curated videos, expand topics, and find more content as needed

## 🏗️ Architecture

### Frontend
- **React + TypeScript**: Modern React with full TypeScript support
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS with custom design tokens
- **shadcn/ui**: Beautiful, accessible UI components
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Backend
- **Lovable Cloud**: Serverless backend powered by Supabase
- **Edge Functions**: TypeScript/Deno serverless functions for:
  - PDF text extraction and processing
  - AI-powered topic analysis
  - YouTube video search and curation
- **File Storage**: Secure PDF storage buckets
- **AI Integration**: Lovable AI gateway for topic extraction

## 📋 Prerequisites

- Node.js 18+ and npm
- YouTube Data API v3 key (free from Google Cloud Console)
- Lovable Cloud enabled (automatic with this project)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd newtonai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The following environment variables are automatically configured through Lovable Cloud:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon key
- `LOVABLE_API_KEY` - AI gateway access (pre-configured)
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key

**Note**: The YouTube API key has already been configured through Lovable's secure secrets management.

### 4. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. The key is already stored securely in your project secrets

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🎯 API Endpoints

### Process PDF
```
POST /functions/v1/process-pdf
```
**Request Body**:
```json
{
  "pdfContent": "base64-encoded-pdf",
  "fileName": "document.pdf"
}
```

**Response**:
```json
{
  "topics": [
    {
      "heading": "Topic Name",
      "summary": "Brief summary of the topic",
      "videos": [...]
    }
  ]
}
```

### Search YouTube
```
POST /functions/v1/search-youtube
```
**Request Body**:
```json
{
  "query": "topic to search"
}
```

**Response**:
```json
{
  "videos": [
    {
      "id": "video-id",
      "videoId": "video-id",
      "title": "Video Title",
      "thumbnail": "thumbnail-url",
      "channelTitle": "Channel Name"
    }
  ]
}
```

## 🎨 Design System

newtonAI uses a carefully crafted design system with:

- **Primary Color**: Deep Teal (#0D9488) - Trust and education
- **Secondary Color**: Bright Blue (#3B82F6) - Actions and interactivity  
- **Accent Color**: Warm Amber (#F59E0B) - Highlights and emphasis
- **Custom Gradients**: Smooth color transitions for hero sections and cards
- **Smooth Animations**: Fade-in, scale, and hover effects for a polished feel
- **Responsive Design**: Mobile-first approach with breakpoints

All design tokens are defined in `src/index.css` and can be easily customized.

## 📦 Project Structure

```
newtonai/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx       # Drag-and-drop PDF upload
│   │   ├── ResultsView.tsx      # Display extracted topics
│   │   ├── TopicCard.tsx        # Individual topic with videos
│   │   └── VideoCard.tsx        # YouTube video thumbnail card
│   ├── pages/
│   │   └── Index.tsx            # Main app page
│   ├── index.css                # Design system tokens
│   └── ...
├── supabase/
│   ├── functions/
│   │   ├── process-pdf/         # PDF processing edge function
│   │   └── search-youtube/      # YouTube search edge function
│   └── config.toml              # Supabase configuration
├── index.html                   # SEO-optimized HTML
└── README.md
```

## 🚢 Deployment

### Deploy with Lovable

1. Click "Publish" in the Lovable editor (top-right corner)
2. Your app will be deployed to `yourapp.lovable.app`
3. Edge functions deploy automatically with your app

### Connect Custom Domain

1. Go to Project Settings → Domains
2. Click "Connect Domain"
3. Follow the DNS configuration instructions
4. Your app will be live on your custom domain

## 🎓 Targeted Educational Channels

newtonAI prioritizes content from these high-quality educational channels:

- Khan Academy
- CrashCourse
- TED-Ed
- Kurzgesagt – In a Nutshell
- 3Blue1Brown
- Veritasium
- VSauce
- And many more top educational creators

## 🔒 Security & Privacy

- All API keys stored securely in Supabase secrets
- PDFs processed server-side, not stored permanently
- CORS properly configured for secure client-server communication
- Row-level security policies on storage

## 🐛 Troubleshooting

### PDF Processing Fails
- Ensure PDF is not password-protected
- Check that PDF contains extractable text (not just images)
- Try a smaller PDF if it's very large

### No Videos Found
- Verify YouTube API key is valid and has quota remaining
- Check that the API key has YouTube Data API v3 enabled
- Try more specific or general topics

### Build Errors
```bash
npm run build
```
Check console for specific errors and ensure all dependencies are installed.

## 📝 Notes on Implementation

- **Backend**: Uses TypeScript/Deno edge functions (not Python/Flask) as Lovable supports TypeScript backends
- **PDF Parsing**: Simple text extraction from PDF binary (works for most PDFs with text)
- **AI**: Lovable AI (Gemini 2.5 Flash) for intelligent topic extraction - no external AI API needed
- **Production Ready**: Includes error handling, loading states, CORS, and proper TypeScript types

## 🤝 Contributing

This is a Lovable-generated project. To make changes:

1. Edit directly in Lovable editor (recommended)
2. Or clone, edit locally, and push to connected GitHub repo
3. Changes sync automatically between Lovable and GitHub

## 📄 License

MIT License - feel free to use this project for your own learning needs!

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) - AI-powered web app builder
- Powered by [Supabase](https://supabase.com) through Lovable Cloud
- Educational content from amazing YouTube creators worldwide

---

**Happy Learning! 📚✨**

For support or questions, visit [Lovable Docs](https://docs.lovable.dev)
