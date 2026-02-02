import { BookOpen, Lightbulb, Target, Users, CheckCircle } from "lucide-react";
import { ToolId } from "./toolPromoData";

interface EducationalContentData {
  whatItDoes: {
    title: string;
    paragraphs: string[];
  };
  howToUse: {
    title: string;
    steps: string[];
  };
  tips: {
    title: string;
    items: string[];
  };
  idealFor: {
    title: string;
    audiences: string[];
    description: string;
  };
}

const educationalContent: Record<ToolId, EducationalContentData> = {
  quiz: {
    whatItDoes: {
      title: "What is the AI Quiz Generator?",
      paragraphs: [
        "The AI Quiz Generator is an advanced educational tool that transforms any study material into interactive practice quizzes. Using state-of-the-art natural language processing, our AI analyzes your uploaded content—whether it's a PDF textbook, lecture notes, YouTube video transcript, or handwritten notes—and automatically generates relevant, challenging questions that test your understanding of the key concepts.",
        "Unlike traditional quiz makers that require manual question creation, our AI understands the context and hierarchy of information in your materials. It identifies main topics, supporting details, and relationships between concepts to create questions at various difficulty levels. This means you get a comprehensive assessment tool in seconds rather than hours.",
        "Each generated quiz includes multiple question formats: multiple choice, true/false, and short answer questions. The AI also generates detailed explanations for each answer, helping you understand not just what the correct answer is, but why it's correct and why other options are incorrect."
      ]
    },
    howToUse: {
      title: "How to Use the Quiz Generator",
      steps: [
        "Step 1: Choose your input method. Upload a PDF document, paste text directly, record a lecture using the built-in recorder, or enter a YouTube URL for video content.",
        "Step 2: Select your quiz preferences. Choose the number of questions (5-50), difficulty level (easy, medium, hard, or mixed), and question types you want included.",
        "Step 3: Click 'Generate Quiz' and wait a few seconds while our AI processes your content and creates personalized questions.",
        "Step 4: Take the quiz interactively with instant feedback on each question, or export it as a PDF for offline study or sharing with classmates.",
        "Step 5: Review your results to identify knowledge gaps. Use the 'Retry Wrong Answers' feature to focus on areas that need more practice."
      ]
    },
    tips: {
      title: "Tips for Best Results",
      items: [
        "For textbooks, upload specific chapters rather than entire books for more focused, relevant questions.",
        "Use the difficulty slider to match your current understanding—start with easier questions and progress to harder ones.",
        "Take quizzes multiple times with shuffled questions to reinforce learning through spaced repetition.",
        "Review the detailed explanations even for questions you got right to deepen your understanding."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["College students preparing for exams", "High school students reviewing course material", "Professional certification candidates", "Self-learners studying new subjects", "Teachers creating assessment materials"],
      description: "The AI Quiz Generator is particularly valuable for students who learn best through active recall and self-testing. Research shows that practice testing is one of the most effective study techniques, significantly improving long-term retention compared to passive reading or highlighting."
    }
  },
  flashcards: {
    whatItDoes: {
      title: "What is the AI Flashcard Generator?",
      paragraphs: [
        "The AI Flashcard Generator is a powerful study tool that automatically creates digital flashcards from any learning material you provide. By leveraging advanced AI technology, it extracts key concepts, definitions, facts, and relationships from your documents and transforms them into effective question-and-answer pairs optimized for memory retention.",
        "Our flashcard system is built on the science of spaced repetition—a learning technique that presents information at increasing intervals to move knowledge from short-term to long-term memory. Each flashcard is designed to prompt active recall, which research has shown to be significantly more effective than passive review methods.",
        "The AI doesn't just pull random sentences from your text. It understands the educational structure of your content, identifying what's worth memorizing: vocabulary terms, formulas, historical dates, scientific processes, and cause-effect relationships. This intelligent extraction ensures you're studying the material that matters most."
      ]
    },
    howToUse: {
      title: "How to Create Flashcards",
      steps: [
        "Step 1: Upload your study material in any supported format—PDF documents, images of notes, audio recordings of lectures, or YouTube video links.",
        "Step 2: Our AI will analyze your content and identify the key concepts, terms, and facts that should be converted into flashcards.",
        "Step 3: Review the generated flashcards and customize them if needed. You can edit, delete, or add your own cards to the deck.",
        "Step 4: Study your flashcards using our interactive flip-card interface. Mark cards as 'mastered' to track your progress.",
        "Step 5: Use shuffle mode to randomize card order and prevent order-dependent memorization."
      ]
    },
    tips: {
      title: "Tips for Effective Flashcard Study",
      items: [
        "Study flashcards daily in short sessions (15-20 minutes) rather than cramming in long sessions.",
        "Focus on cards you find difficult—mark easy cards as mastered and let the system prioritize challenging material.",
        "Say answers out loud before flipping the card to strengthen memory encoding.",
        "Create flashcards from your own notes in addition to AI-generated ones for personalized learning."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Medical and nursing students learning terminology", "Language learners memorizing vocabulary", "Law students studying case law and statutes", "History students memorizing dates and events", "Anyone learning factual information"],
      description: "Flashcards are ideal for any subject requiring memorization of discrete facts. The AI Flashcard Generator is especially valuable for students in medicine, law, languages, and sciences where terminology mastery is crucial for success."
    }
  },
  podcast: {
    whatItDoes: {
      title: "What is the AI Podcast Generator?",
      paragraphs: [
        "The AI Podcast Generator transforms your written study materials into engaging audio content featuring two AI hosts discussing your topic in a natural, conversational format. This innovative tool is designed for auditory learners and busy students who want to study while commuting, exercising, or doing household tasks.",
        "Unlike simple text-to-speech tools, our AI Podcast Generator creates a dynamic dialogue between two hosts who explain concepts, ask each other questions, and provide examples and analogies. This conversational format makes complex topics more accessible and keeps listeners engaged throughout the learning experience.",
        "The podcasts are generated using professional-quality AI voices that sound natural and clear. You can choose from over 30 languages and multiple voice personalities to match your preferences. The 'Raise Hand' feature even lets you interrupt the podcast to ask questions and receive AI-generated answers in real-time."
      ]
    },
    howToUse: {
      title: "How to Create AI Podcasts",
      steps: [
        "Step 1: Upload or paste the content you want converted into a podcast—lecture notes, textbook chapters, or any study material.",
        "Step 2: Choose your podcast style (casual, academic, or detailed) and select the language and voice personalities for your hosts.",
        "Step 3: Click 'Generate Podcast' and wait while our AI creates a natural-sounding discussion of your material.",
        "Step 4: Listen to your podcast in the built-in player. Use the 'Raise Hand' button to pause and ask questions at any point.",
        "Step 5: Download the audio file to listen offline on your phone, during commutes, or while exercising."
      ]
    },
    tips: {
      title: "Tips for Audio Learning",
      items: [
        "Listen to podcasts during otherwise 'dead' time—commuting, walking, doing chores—to maximize study hours.",
        "Take brief notes on key points you hear to reinforce learning with visual memory.",
        "Re-listen to podcasts multiple times; repetition strengthens retention of audio content.",
        "Use headphones for better focus and clearer comprehension of the AI voices."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Auditory learners who retain spoken information better", "Commuters who want to study during travel", "Students with visual fatigue from screen time", "People with reading difficulties or dyslexia", "Multi-taskers who study while exercising"],
      description: "The AI Podcast Generator is perfect for students who absorb information better through listening. It's also ideal for anyone wanting to supplement traditional study methods with audio content that fits into busy schedules."
    }
  },
  "mind-map": {
    whatItDoes: {
      title: "What is the AI Mind Map Generator?",
      paragraphs: [
        "The AI Mind Map Generator transforms linear text into visual concept maps that show how ideas connect and relate to each other. This powerful visualization tool helps you understand complex topics by revealing the hierarchical structure and relationships between concepts that aren't always obvious in written form.",
        "Our AI analyzes your content to identify main themes, subtopics, supporting details, and the connections between them. It then generates an interactive mind map that you can zoom, pan, and explore. This visual representation engages spatial reasoning and helps create stronger mental models of the material.",
        "The tool offers four different layout styles—radial, tree, cluster, and timeline—so you can choose the visualization that best matches your topic and learning preferences. Each layout emphasizes different aspects of the information structure, from hierarchical relationships to chronological sequences."
      ]
    },
    howToUse: {
      title: "How to Create Mind Maps",
      steps: [
        "Step 1: Upload or paste the content you want to visualize—this works great with textbook chapters, lecture summaries, or research papers.",
        "Step 2: Select your preferred layout style: radial for exploring outward from a central concept, tree for hierarchical topics, cluster for related groups, or timeline for historical events.",
        "Step 3: Click 'Generate Mind Map' and watch as the AI creates an interactive visual representation of your content.",
        "Step 4: Explore the map by zooming in to see details or zooming out for the big picture. Click on nodes to see connected concepts.",
        "Step 5: Export your mind map as an image to include in notes or presentations."
      ]
    },
    tips: {
      title: "Tips for Visual Learning",
      items: [
        "Use radial layout for topics with one central concept and many related ideas branching outward.",
        "Choose tree layout for topics with clear parent-child hierarchies, like biological classifications or organizational structures.",
        "Start by zooming out to understand the overall structure before diving into specific sections.",
        "Print mind maps and hang them in your study area for passive review throughout the day."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Visual learners who think in pictures and spatial relationships", "Students studying complex interconnected topics", "Anyone preparing presentations or essays", "People who need to understand 'big picture' concepts", "Researchers organizing literature reviews"],
      description: "Mind maps are especially valuable for visual-spatial learners and anyone studying topics with many interconnected concepts. They're excellent for subjects like biology, history, literature, and any field where understanding relationships between ideas is crucial."
    }
  },
  notes: {
    whatItDoes: {
      title: "What is the AI Lecture Notes Generator?",
      paragraphs: [
        "The AI Lecture Notes Generator creates comprehensive, well-organized study notes from any audio or text content. Whether you record a live lecture, upload a recorded class session, or paste transcript text, our AI transforms spoken or written content into structured notes with clear headings, bullet points, and highlighted key concepts.",
        "Unlike simple transcription tools, our AI understands educational content and organizes it in a way that facilitates learning. It identifies main topics and subtopics, extracts key definitions and formulas, and creates a logical structure that makes review efficient. The result is notes that look like they were taken by a professional student.",
        "The tool supports multiple note-taking templates: lecture notes format with date and course headers, study guide format with learning objectives, research notes with citation sections, and project notes for group work. Full LaTeX support means mathematical equations, chemical formulas, and scientific notation render beautifully."
      ]
    },
    howToUse: {
      title: "How to Generate Lecture Notes",
      steps: [
        "Step 1: Choose your input method: record a lecture in real-time using your device microphone, upload an audio/video file, or paste text from slides or transcripts.",
        "Step 2: Select a note template that matches your needs—lecture notes, study guide, research notes, or project notes.",
        "Step 3: Click 'Generate Notes' and wait while our AI transcribes (if audio) and organizes your content into structured notes.",
        "Step 4: Review and edit the generated notes. Add your own annotations or highlight sections you want to emphasize.",
        "Step 5: Export your notes as PDF or use the text-to-speech feature to listen to them for additional review."
      ]
    },
    tips: {
      title: "Tips for Better Notes",
      items: [
        "For recorded lectures, use a good microphone and minimize background noise for better transcription accuracy.",
        "Use the study guide template before exams—it automatically extracts learning objectives and key concepts.",
        "Combine AI-generated notes with your own handwritten notes for the most effective study materials.",
        "Review notes within 24 hours of a lecture to significantly improve long-term retention."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Students who struggle to take notes and listen simultaneously", "Non-native speakers who need written records of lectures", "Students with learning differences like ADHD or dyslexia", "Anyone who missed a class and needs to catch up", "Graduate students managing heavy course loads"],
      description: "The AI Lecture Notes Generator is invaluable for students who find it difficult to simultaneously listen and take comprehensive notes. It's also excellent for reviewing recorded lectures and creating study materials from any audio content."
    }
  },
  summarizer: {
    whatItDoes: {
      title: "What is the AI Summarizer?",
      paragraphs: [
        "The AI Summarizer condenses lengthy documents, articles, and videos into concise, easy-to-digest summaries that capture the essential information. Whether you're facing a 50-page research paper or a 2-hour lecture video, our AI can distill it down to the key points you need to know.",
        "Our summarization engine doesn't just extract random sentences—it understands the structure and meaning of content to identify truly important information. It preserves key arguments, main findings, crucial details, and conclusions while removing redundancy, examples, and tangential points that aren't essential for understanding.",
        "The tool offers multiple summary formats: concise summaries for quick overviews (2-3 paragraphs), detailed summaries that preserve more nuance, bullet-point summaries for easy scanning, and academic summaries formatted for research purposes. After summarizing, you can instantly convert the content into flashcards, quizzes, or podcasts for multi-modal studying."
      ]
    },
    howToUse: {
      title: "How to Use the Summarizer",
      steps: [
        "Step 1: Upload your document (PDF), paste text, record audio, or enter a YouTube URL for video content.",
        "Step 2: Choose your summary format: concise for quick overviews, detailed for comprehensive summaries, bullet points for scanning, or academic for research contexts.",
        "Step 3: Click 'Summarize' and wait while our AI analyzes and condenses your content.",
        "Step 4: Review the summary and use the integrated tools to create flashcards, quizzes, or podcasts from the summarized content.",
        "Step 5: Export the summary as a PDF or copy it to your clipboard for use in notes or assignments."
      ]
    },
    tips: {
      title: "Tips for Effective Summarization",
      items: [
        "Use concise summaries for initial review, then read the full document for depth on important sections.",
        "Bullet-point format works best for textbooks with many discrete facts; detailed format is better for argumentative texts.",
        "Generate summaries before reading to preview content and know what to look for in the full document.",
        "Combine summaries with flashcards for the most efficient study workflow."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Students with large reading loads to manage", "Researchers reviewing literature quickly", "Professionals staying current with industry publications", "Anyone preparing for discussions or presentations", "Students who need accessibility accommodations"],
      description: "The AI Summarizer is essential for anyone facing information overload. It's particularly valuable for graduate students, researchers, and professionals who need to process large volumes of text efficiently without missing critical information."
    }
  },
  "homework-help": {
    whatItDoes: {
      title: "What is the AI Homework Helper?",
      paragraphs: [
        "The AI Homework Helper provides detailed, step-by-step solutions to homework problems across all subjects. Unlike answer-only tools that promote copying, our system is designed to teach you the problem-solving process so you can tackle similar problems independently on tests and exams.",
        "Simply take a photo of your homework problem or type/paste the question, and our AI will break down the solution into clear, logical steps with explanations for each one. The tool handles everything from basic arithmetic to advanced calculus, from grammar questions to physics problems, supporting students from middle school through graduate studies.",
        "Every solution includes the reasoning behind each step, relevant formulas or rules being applied, and tips for recognizing similar problems in the future. LaTeX rendering ensures mathematical expressions, chemical equations, and scientific notation appear correctly formatted and easy to read."
      ]
    },
    howToUse: {
      title: "How to Get Homework Help",
      steps: [
        "Step 1: Upload an image of your homework problem using your camera or gallery, or type/paste the problem text directly.",
        "Step 2: Wait a few seconds while our AI analyzes the problem and determines the best solution approach.",
        "Step 3: Review the step-by-step solution, paying attention to the explanation provided for each step.",
        "Step 4: Use the 'Explain More' button on any step you don't understand to get additional clarification.",
        "Step 5: Try similar problems on your own using the techniques you learned from the solution."
      ]
    },
    tips: {
      title: "Tips for Effective Learning",
      items: [
        "Don't just copy the answer—read each step and make sure you understand the reasoning before moving on.",
        "After reviewing a solution, try solving the problem yourself without looking before checking your work.",
        "Use the text-to-speech feature to listen to solutions for a multi-sensory learning experience.",
        "Keep a notebook of problem types and the techniques used to solve them for exam review."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Students struggling with specific subjects", "Self-studying students without access to tutors", "Parents helping children with homework", "Students preparing for standardized tests", "Anyone wanting to understand problem-solving methods"],
      description: "The AI Homework Helper is designed for students who want to learn, not just get answers. It's perfect for subjects like math, physics, chemistry, and any field where understanding the solution process is as important as getting the right answer."
    }
  },
  "pdf-chat": {
    whatItDoes: {
      title: "What is Chat with PDF?",
      paragraphs: [
        "Chat with PDF is an AI-powered document assistant that lets you have a conversation with any PDF document. Instead of reading through pages to find specific information, you can simply ask questions in natural language and receive accurate, referenced answers pulled directly from your document.",
        "Powered by advanced RAG (Retrieval-Augmented Generation) technology, our system doesn't just search for keywords—it understands the semantic meaning of your questions and the content of your document. This means you can ask complex questions, request explanations, and even ask the AI to relate different parts of the document together.",
        "Every answer includes citations showing exactly which pages the information came from, so you can verify answers and dive deeper into the source material. Beyond Q&A, the tool integrates with our full suite of study tools—generate quizzes, flashcards, summaries, or mind maps directly from your document conversation."
      ]
    },
    howToUse: {
      title: "How to Chat with Documents",
      steps: [
        "Step 1: Upload a PDF document (textbook chapter, research paper, lecture slides, or any PDF up to 100 pages).",
        "Step 2: Wait for the AI to process and index your document—this takes a few seconds for thorough understanding.",
        "Step 3: Start asking questions in the chat interface. Be specific or general—the AI adapts to your needs.",
        "Step 4: Click on citation links to jump directly to the relevant page in the document viewer.",
        "Step 5: Use the integrated study tools to generate flashcards, quizzes, or summaries from the document."
      ]
    },
    tips: {
      title: "Tips for Document Chat",
      items: [
        "Start with broad questions to understand the document's main themes, then drill down into specific sections.",
        "Ask 'explain this like I'm a beginner' for complex topics to get simplified explanations.",
        "Use the page filter to focus the AI's answers on specific sections when studying particular chapters.",
        "Combine with the quiz generator to test yourself on content you've discussed with the AI."
      ]
    },
    idealFor: {
      title: "Who Benefits Most?",
      audiences: ["Students studying dense academic papers", "Researchers reviewing technical documents", "Professionals reading long reports", "Law students analyzing case documents", "Anyone who needs to quickly extract information from PDFs"],
      description: "Chat with PDF is ideal for anyone who needs to extract, understand, or analyze information from documents quickly. It's especially valuable for research, legal work, and academic study where documents are long and time is limited."
    }
  }
};

interface ToolPageEducationalContentProps {
  toolId: ToolId;
}

export function ToolPageEducationalContent({ toolId }: ToolPageEducationalContentProps) {
  const content = educationalContent[toolId];
  
  if (!content) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* What It Does Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {content.whatItDoes.title}
            </h2>
          </div>
          <div className="space-y-4">
            {content.whatItDoes.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* How To Use Section */}
        <div className="mb-12 bg-muted/30 rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {content.howToUse.title}
            </h2>
          </div>
          <ol className="space-y-4">
            {content.howToUse.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <p className="text-muted-foreground leading-relaxed">{step.replace(/^Step \d+:\s*/, '')}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {content.tips.title}
            </h2>
          </div>
          <ul className="space-y-3">
            {content.tips.items.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal For Section */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 md:p-8 border border-primary/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              {content.idealFor.title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {content.idealFor.audiences.map((audience, index) => (
              <span 
                key={index} 
                className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full"
              >
                {audience}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {content.idealFor.description}
          </p>
        </div>
      </div>
    </section>
  );
}
